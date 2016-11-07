(function () {
    angular.module('bin.price', ['bin.price.services', 'bin.price.templates', 'toggle.edit.mode', 'catalog', 'notifications'])
        .component('binPrice', new BinPriceComponent());

    function BinPriceComponent() {
        this.templateUrl = 'bin-price.html';

        this.bindings = {
            item: '<catalogItem',
            readOnly: '@',
            onConfigChanged: '&'
        };

        this.controller = ['$scope', 'binPriceSettings', 'topicRegistry', 'editModeRenderer', 'updateCatalogItem', function ($scope, priceSettings, topics, editModeRenderer, updateCatalogItem) {
            var ctrl = this, destroyHandlers = [];

            if (isInReadOnlyMode()) ctrl.state = new ReadOnlyState();
            else subscribeToEditMode();

            function ReadOnlyState() {
                this.name = 'readOnly';
            }

            function AddState() {
                this.name = 'add';
                this.updatePrice = updatePrice;
            }

            function UpdateState() {
                this.name = 'update';
                this.updatePrice = updatePrice;
            }

            ctrl.updatePrice = function () {
                if (ctrl.state.updatePrice) ctrl.state.updatePrice();
            };

            function isInReadOnlyMode() {
                return angular.isDefined(ctrl.readOnly);
            }

            function subscribeToEditMode() {
                topics.subscribe('edit.mode', onEditModeChanged);
                destroyHandlers.push(function () {
                    topics.unsubscribe('edit.mode', onEditModeChanged);
                });
            }

            function onEditModeChanged(editMode) {
                if (!editMode) ctrl.state = new ReadOnlyState();
                else updateEditState();
            }

            function updateEditState() {
                ctrl.state = ctrl.item.presentableUnitPrice ? new UpdateState() : new AddState();
            }

            function updatePrice() {
                var scope = $scope.$new(true);

                function UnconfirmedState() {
                    var state = this;
                    state.name = 'unconfirmed';
                    scope.working = false;

                    state.close = editModeRenderer.close;

                    priceSettings.getPriceConfig().then(onSuccess, transitionToErrorState);

                    function onSuccess(results) {
                        mapResultsOnState(results, state);
                        state.submit = updatePriceConfig;
                    }
                }

                function ConfigState(settings) {
                    var state = this;
                    state.name = 'config';
                    scope.working = false;

                    state.cancel = function () {
                        scope.state = new ConfirmedState(settings);
                    };

                    priceSettings.getPriceConfig().then(onSuccess, transitionToErrorState);

                    function onSuccess(results) {
                        mapResultsOnState(results, state);
                        state.submit = updatePriceConfig;
                    }
                }

                function ConfirmedState(settings) {
                    var state = this;
                    state.name = 'confirmed';
                    scope.working = false;
                    state.close = editModeRenderer.close;
                    state.currency = settings.currency;
                    state.vatOnPrice = settings.vatOnPriceInterpretedAs == 'included';
                    state.price = getPrice();

                    function getPrice() {
                        return (state.vatOnPrice ? (ctrl.item.unitPrice || ctrl.item.price) : ctrl.item.price) / 100;
                    }

                    state.toggleVatOnPrice = function () {
                        priceSettings.updateVatOnPriceInterpretedAs(state.vatOnPrice ? 'included' : 'excluded').then(onSuccess, transitionToErrorState);

                        function onSuccess() {
                            state.price = getPrice()
                        }
                    };

                    state.openConfig = function () {
                        scope.state = new ConfigState(settings);
                    };

                    state.submit = function () {
                        scope.working = true;

                        updateCatalogItem({
                            data: {
                                id: ctrl.item.id,
                                type: ctrl.item.type,
                                price: Math.round(state.price * 100),
                                context: 'update'
                            },
                            success: onSuccess, error: transitionToErrorState
                        });

                        function onSuccess() {
                            editModeRenderer.close();
                        }
                    };
                }

                function ErrorState() {
                    this.name = 'error';
                    scope.working = false;
                    this.tryAgain = initialize;
                    this.close = editModeRenderer.close;
                }

                function initialize() {
                    priceSettings.getPriceSettings().then(onSuccess, transitionToErrorState);

                    function onSuccess(settings) {
                        scope.state = settings.status == 'unconfirmed' ? new UnconfirmedState() : new ConfirmedState(settings);
                    }
                }

                initialize();

                scope.submit = function () {
                    if (scope.state.submit) scope.state.submit();
                };

                function mapResultsOnState(results, state) {
                    state.country = results.country;
                    state.countries = results.countries;
                    state.vatRate = results.vatRate;
                    state.vatRates = results.vatRates;
                    state.currency = results.currency;
                    state.currencies = results.currencies;

                    state.getStandardVatRate = function () {
                        var rate = state.vatRates[state.country];
                        state.vatRate = rate ? parseFloat(rate.standard_rate || 0) : 0;
                    };
                }

                function updatePriceConfig() {
                    scope.working = true;

                    priceSettings.updatePriceConfig({
                        country: scope.state.country,
                        vatRate: scope.state.vatRate,
                        currency: scope.state.currency
                    }).then(onUpdateSuccess, transitionToErrorState);

                    function onUpdateSuccess() {
                        if (ctrl.onConfigChanged) ctrl.onConfigChanged().then(initialize, transitionToErrorState);
                        else initialize();
                    }
                }

                function transitionToErrorState() {
                    scope.state = new ErrorState();
                }

                editModeRenderer.open({
                    templateUrl: 'bin-price-edit.html',
                    scope: scope
                });
            }

            ctrl.$onChanges = function () {
                if (!isInReadOnlyMode()) updateEditState();
            };

            ctrl.$onDestroy = function () {
                destroyHandlers.forEach(function (handler) {
                    handler();
                });
            };
        }];
    }
})();