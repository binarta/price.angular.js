(function () {
    angular.module('bin.price', ['bin.price.services', 'bin.price.templates', 'toggle.edit.mode', 'catalog', 'notifications', 'binarta-checkpointjs-angular1'])
        .component('binPrice', new BinPriceComponent());

    function BinPriceComponent() {
        this.templateUrl = 'bin-price.html';

        this.bindings = {
            item: '<catalogItem',
            readOnly: '@',
            onUpdate: '&',
            templateUrl: '@'
        };

        this.require = {
            itemCtrl: '?^^binCatalogItem'
        };

        this.controller = ['$scope', 'binPriceSettings', 'topicRegistry', 'editModeRenderer', 'updateCatalogItem', 'binarta',
            function ($scope, priceSettings, topics, editModeRenderer, updateCatalogItem, binarta) {
                var $ctrl = this,
                    destroyHandlers = [],
                    editing = false;

                $ctrl.$onInit = function () {
                    if (!$ctrl.templateUrl)
                        $ctrl.templateUrl = 'bin-price-default.html';
                    if ($ctrl.itemCtrl && !$ctrl.item)
                        $ctrl.item = $ctrl.itemCtrl.item;
                    $ctrl.price = $ctrl.item.presentableUnitPrice;
                    if (isInReadOnlyMode()) $ctrl.state = new ReadOnlyState();
                    else {
                        installProfileObserver();
                        binarta.checkpoint.profile.isAuthenticated() ? onSignedIn() : onSignedOut();
                    }
                };

                function installProfileObserver() {
                    var profileObserver = binarta.checkpoint.profile.eventRegistry.observe({
                        signedin: onSignedIn,
                        signedout: onSignedOut
                    });
                    destroyHandlers.push(function () {
                        profileObserver.disconnect();
                    });
                }

                function onSignedIn() {
                    if (isPermitted()) subscribeToEditMode();
                    else $ctrl.state = new ReadOnlyState();
                }

                function onSignedOut() {
                    $ctrl.state = new ReadOnlyState();
                }

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

                $ctrl.updatePrice = function () {
                    if ($ctrl.state.updatePrice) $ctrl.state.updatePrice();
                };

                function isInReadOnlyMode() {
                    return angular.isDefined($ctrl.readOnly);
                }

                function subscribeToEditMode() {
                    topics.subscribe('edit.mode', onEditModeChanged);
                    destroyHandlers.push(function () {
                        topics.unsubscribe('edit.mode', onEditModeChanged);
                    });
                }

                function onEditModeChanged(editMode) {
                    editing = editMode;
                    updateState();
                }

                function updateState() {
                    $ctrl.price = $ctrl.item.presentableUnitPrice;
                    if (editing && isPermitted()) $ctrl.state = $ctrl.item.presentableUnitPrice ? new UpdateState() : new AddState();
                    else $ctrl.state = new ReadOnlyState();
                }

                function isPermitted() {
                    return binarta.checkpoint.profile.hasPermission('catalog.item.update');
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
                        state.vatOnPrice = settings.vatOnPriceInterpretedAs === 'included';
                        state.price = getPrice();

                        function getPrice() {
                            return (state.vatOnPrice ? ($ctrl.item.unitPriceInclVat || $ctrl.item.unitPrice || $ctrl.item.price) : $ctrl.item.price) / 100;
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
                                    id: $ctrl.item.id,
                                    type: $ctrl.item.type,
                                    price: Math.round(state.price * 100),
                                    context: 'update'
                                },
                                success: onSuccess, error: transitionToErrorState
                            });

                            function onSuccess() {
                                if ($ctrl.onUpdate) $ctrl.onUpdate();
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
                            scope.state = settings.status === 'unconfirmed' ? new UnconfirmedState() : new ConfirmedState(settings);
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
                            if ($ctrl.onUpdate) {
                                var promise = $ctrl.onUpdate();
                                if (promise && promise.then) promise.then(initialize, transitionToErrorState);
                            }
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

                $ctrl.$onChanges = function () {
                    if (!isInReadOnlyMode()) updateState();
                };

                $ctrl.$onDestroy = function () {
                    destroyHandlers.forEach(function (handler) {
                        handler();
                    });
                };
            }];
    }
})();