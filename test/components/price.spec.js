describe('bin.price', function () {
    beforeEach(module('bin.price'));

    describe('binPrice component', function () {
        var $componentController, $q, $ctrl, priceSettings, topics, edit, catalogItem, updateCatalogItem, binarta;

        beforeEach(inject(function (_$q_, _$componentController_, binPriceSettings, topicRegistry, editModeRenderer, _updateCatalogItem_, _binarta_) {
            $q = _$q_;
            $componentController = _$componentController_;
            priceSettings = binPriceSettings;
            topics = topicRegistry;
            edit = editModeRenderer;
            updateCatalogItem = _updateCatalogItem_;
            binarta = _binarta_;
            catalogItem = {
                id: 'id',
                type: 'type',
                unitPrice: 110,
                unitPriceInclVat: 125,
                price: 110
            };
            binarta.checkpoint.gateway.permissions = [];
            binarta.checkpoint.registrationForm.submit({username: 'u', password: 'p', email: 'e'});
        }));

        describe('when component is set in read-only mode', function () {
            describe('with item attribute', function () {
                beforeEach(function () {
                    $ctrl = $componentController('binPrice', null, {item: catalogItem, readOnly: ''});
                    catalogItem.presentableUnitPrice = '$1.25';
                    $ctrl.$onInit();
                });

                afterEach(function () {
                    $ctrl.$onDestroy();
                });

                it('uses default template url', function () {
                    expect($ctrl.templateUrl).toEqual('bin-price-default.html');
                });

                it('component is in readOnly state', function () {
                    expect($ctrl.state.name).toEqual('readOnly');
                });

                it('catalog item is available', function () {
                    expect($ctrl.item).toEqual(catalogItem);
                });

                it('exposes the presentable unit price as price', function () {
                    expect($ctrl.price).toBeDefined();
                    expect($ctrl.price).toEqual(catalogItem.presentableUnitPrice);
                });

                describe('on catalogItem data changes', function () {
                    beforeEach(function () {
                        catalogItem.presentableUnitPrice = 'updated';
                    });

                    it('updated presentableUnitPrice is available', function () {
                        expect($ctrl.item.presentableUnitPrice).toEqual(catalogItem.presentableUnitPrice);
                    });
                });
            });

            it('you can specify a custom template url', function () {
                $ctrl = $componentController('binPrice', null, {
                    item: catalogItem,
                    readOnly: '',
                    templateUrl: 'custom-template.html'
                });
                $ctrl.$onInit();
                expect($ctrl.templateUrl).toEqual('custom-template.html');
                $ctrl.$onDestroy();
            });

            describe('when wrapped inside <bin-catalog-item/>', function () {
                beforeEach(function () {
                    $ctrl = $componentController('binPrice', null, {readOnly: ''});
                    $ctrl.itemCtrl = {item: catalogItem};
                });

                describe('without item attribute', function () {
                    beforeEach(function () {
                        $ctrl.$onInit();
                    });

                    it('expose catalog item from <bin-catalog--item/>', function () {
                        expect($ctrl.item).toEqual(catalogItem);
                    });
                });

                describe('with item attribute', function () {
                    beforeEach(function () {
                        $ctrl.item = 'from-attribute';
                        $ctrl.$onInit();
                    });

                    it('expose catalog item from <bin-catalog--item/>', function () {
                        expect($ctrl.item).toEqual('from-attribute');
                    });
                });
            });
        });

        describe('when component is not set in read-only mode', function () {
            var onUpdateSpy, onUpdateDeferred;

            beforeEach(function () {
                onUpdateDeferred = $q.defer();
                onUpdateSpy = jasmine.createSpy('onUpdate');
                onUpdateSpy.and.returnValue(onUpdateDeferred.promise);
                $ctrl = $componentController('binPrice', null, {item: catalogItem, onUpdate: onUpdateSpy});
            });

            describe('and user has no permission', function () {
                beforeEach(function () {
                    $ctrl.$onInit();
                });

                it('component is in readOnly state', function () {
                    expect($ctrl.state.name).toEqual('readOnly');
                });
            });

            describe('and user has catalog.item.update permission', function () {
                beforeEach(function () {
                    $ctrl.$onInit();
                    binarta.checkpoint.gateway.addPermission('catalog.item.update');
                    binarta.checkpoint.profile.refresh();
                });

                it('subscribed to edit.mode event', function () {
                    expect(topics.subscribe.calls.mostRecent().args[0]).toEqual('edit.mode');
                });

                describe('when not in edit mode', function () {
                    beforeEach(function () {
                        topics.subscribe.calls.mostRecent().args[1](false);
                    });

                    it('component is in readOnly state', function () {
                        expect($ctrl.state.name).toEqual('readOnly');
                    });
                });

                describe('when in edit mode', function () {
                    beforeEach(function () {
                        topics.subscribe.calls.mostRecent().args[1](true);
                    });

                    it('component is in add state', function () {
                        expect($ctrl.state.name).toEqual('add');
                    });

                    describe('on updatePrice', function () {
                        beforeEach(function () {
                            $ctrl.updatePrice();
                        });

                        it('edit-mode renderer is opened', function () {
                            expect(edit.open).toHaveBeenCalledWith({
                                templateUrl: 'bin-price-edit.html',
                                scope: jasmine.any(Object)
                            });
                        });

                        it('price settings are requested', function () {
                            expect(priceSettings.getPriceSettings).toHaveBeenCalled();
                        });

                        describe('with edit-mode renderer scope', function () {
                            var scope;

                            beforeEach(function () {
                                scope = edit.open.calls.mostRecent().args[0].scope;
                            });

                            function assertPriceConfig() {
                                it('price config is requested', function () {
                                    expect(priceSettings.getPriceConfig).toHaveBeenCalled();
                                });

                                describe('with price config', function () {
                                    var priceConfig = {
                                        country: 'B',
                                        countries: ['B'],
                                        vatRate: 1.1,
                                        vatRates: {B: {standard_rate: 2.3}},
                                        currency: 'C',
                                        currencies: ['C']
                                    };

                                    beforeEach(function () {
                                        priceSettings.getPriceConfigDeferred.resolve(priceConfig);
                                        scope.$digest();
                                    });

                                    it('config is available', function () {
                                        expect(scope.state.country).toEqual(priceConfig.country);
                                        expect(scope.state.countries).toEqual(priceConfig.countries);
                                        expect(scope.state.vatRate).toEqual(priceConfig.vatRate);
                                        expect(scope.state.vatRates).toEqual(priceConfig.vatRates);
                                        expect(scope.state.currency).toEqual(priceConfig.currency);
                                        expect(scope.state.currencies).toEqual(priceConfig.currencies);
                                    });

                                    describe('on getStandardVatRate', function () {
                                        beforeEach(function () {
                                            scope.state.getStandardVatRate();
                                        });

                                        it('vatRate is updated', function () {
                                            expect(scope.state.vatRate).toEqual(2.3);
                                        });

                                        describe('and standard_rate is undefined', function () {
                                            beforeEach(function () {
                                                priceConfig.vatRates.B.standard_rate = undefined;
                                                scope.state.getStandardVatRate();
                                            });

                                            it('vatRate is updated', function () {
                                                expect(scope.state.vatRate).toEqual(0);
                                            });
                                        });

                                        describe('and country is not given', function () {
                                            beforeEach(function () {
                                                delete priceConfig.vatRates.B;
                                                scope.state.getStandardVatRate();
                                            });

                                            it('vatRate is updated', function () {
                                                expect(scope.state.vatRate).toEqual(0);
                                            });
                                        });
                                    });

                                    describe('on submit', function () {
                                        beforeEach(function () {
                                            scope.submit();
                                        });

                                        it('is working', function () {
                                            expect(scope.working).toBeTruthy();
                                        });

                                        it('request is made for updatePriceConfig', function () {
                                            expect(priceSettings.updatePriceConfig).toHaveBeenCalledWith({
                                                country: priceConfig.country,
                                                vatRate: priceConfig.vatRate,
                                                currency: priceConfig.currency
                                            });
                                        });

                                        describe('on update success', function () {
                                            beforeEach(function () {
                                                priceSettings.getPriceSettingsDeferred = $q.defer();
                                                priceSettings.getPriceSettings.and.returnValue(priceSettings.getPriceSettingsDeferred.promise);
                                                priceSettings.updatePriceConfigDeferred.resolve();
                                                scope.$digest();
                                            });

                                            it('onUpdate handler is executed', function () {
                                                expect(onUpdateSpy).toHaveBeenCalled();
                                            });

                                            describe('onUpdate success', function () {
                                                beforeEach(function () {
                                                    onUpdateDeferred.resolve();
                                                });

                                                it('price settings are requested', function () {
                                                    expect(priceSettings.getPriceSettings).toHaveBeenCalled();
                                                });

                                                describe('on price settings request success', function () {
                                                    beforeEach(function () {
                                                        priceSettings.getPriceSettingsDeferred.resolve({});
                                                        scope.$digest();
                                                    });

                                                    it('is in confirmed state', function () {
                                                        expect(scope.state.name).toEqual('confirmed');
                                                    });

                                                    it('is not working', function () {
                                                        expect(scope.working).toBeFalsy();
                                                    });
                                                });

                                                describe('on price settings request rejected', function () {
                                                    beforeEach(function () {
                                                        priceSettings.getPriceSettingsDeferred.reject();
                                                        scope.$digest();
                                                    });

                                                    it('is in error state', function () {
                                                        expect(scope.state.name).toEqual('error');
                                                    });
                                                });
                                            });

                                            describe('onUpdate error', function () {
                                                beforeEach(function () {
                                                    onUpdateDeferred.reject();
                                                    scope.$digest();
                                                });

                                                it('is in error state', function () {
                                                    expect(scope.state.name).toEqual('error');
                                                });
                                            });
                                        });

                                        describe('on update rejected', function () {
                                            beforeEach(function () {
                                                priceSettings.updatePriceConfigDeferred.reject();
                                                scope.$digest();
                                            });

                                            it('is in error state', function () {
                                                expect(scope.state.name).toEqual('error');
                                            });

                                            it('is not working', function () {
                                                expect(scope.working).toBeFalsy();
                                            });
                                        });
                                    });
                                });

                                describe('error requesting price config', function () {
                                    beforeEach(function () {
                                        priceSettings.getPriceConfigDeferred.reject();
                                        scope.$digest();
                                    });

                                    it('is in error state', function () {
                                        expect(scope.state.name).toEqual('error');
                                    });

                                    describe('on try again', function () {
                                        beforeEach(function () {
                                            scope.state.tryAgain();
                                        });

                                        it('price settings are requested', function () {
                                            expect(priceSettings.getPriceSettings).toHaveBeenCalled();
                                        });
                                    });

                                    describe('on close', function () {
                                        beforeEach(function () {
                                            scope.state.close();
                                        });

                                        it('edit-mode renderer is closed', function () {
                                            expect(edit.close).toHaveBeenCalled();
                                        });
                                    });
                                });
                            }

                            describe('and price settings are unconfirmed', function () {
                                beforeEach(function () {
                                    priceSettings.getPriceSettingsDeferred.resolve({status: 'unconfirmed'});
                                    scope.$digest();
                                });

                                it('is in unconfirmed state', function () {
                                    expect(scope.state.name).toEqual('unconfirmed');
                                });

                                describe('on close', function () {
                                    beforeEach(function () {
                                        scope.state.close();
                                    });

                                    it('edit-mode renderer is closed', function () {
                                        expect(edit.close).toHaveBeenCalled();
                                    });
                                });

                                assertPriceConfig();
                            });

                            describe('and price settings are confirmed', function () {
                                var settings;

                                beforeEach(function () {
                                    settings = {
                                        status: 'confirmed',
                                        currency: {symbol: 'E'}
                                    };
                                });

                                describe('when vatOnPriceInterpretedAs is included', function () {
                                    beforeEach(function () {
                                        settings.vatOnPriceInterpretedAs = 'included';
                                        priceSettings.getPriceSettingsDeferred.resolve(settings);
                                        scope.$digest();
                                    });

                                    it('vatOnPrice is enabled', function () {
                                        expect(scope.state.vatOnPrice).toBeTruthy();
                                    });

                                    it('price is derived from item unitPrice', function () {
                                        expect(scope.state.price).toEqual(1.25);
                                    });

                                    describe('on toggleVatOnPrice', function () {
                                        beforeEach(function () {
                                            scope.state.toggleVatOnPrice();
                                        });

                                        it('request is made for updateVatOnPriceInterpretedAs', function () {
                                            expect(priceSettings.updateVatOnPriceInterpretedAs).toHaveBeenCalledWith('included');
                                        });

                                        describe('on success', function () {
                                            beforeEach(function () {
                                                $ctrl.item.unitPrice = 500;
                                                $ctrl.item.unitPriceInclVat = 605
                                                priceSettings.updateVatOnPriceInterpretedAsDeferred.resolve();
                                                scope.$digest();
                                            });

                                            it('price is refreshed', function () {
                                                expect(scope.state.price).toEqual(6.05);
                                            });
                                        });

                                        describe('on error', function () {
                                            beforeEach(function () {
                                                priceSettings.updateVatOnPriceInterpretedAsDeferred.reject();
                                                scope.$digest();
                                            });

                                            it('is in error state', function () {
                                                expect(scope.state.name).toEqual('error');
                                            });
                                        });
                                    });

                                    describe('on openConfig', function () {
                                        beforeEach(function () {
                                            scope.state.openConfig();
                                        });

                                        it('is in config state', function () {
                                            expect(scope.state.name).toEqual('config');
                                        });

                                        assertPriceConfig();

                                        describe('on cancel', function () {
                                            beforeEach(function () {
                                                scope.state.cancel();
                                            });

                                            it('is in confirmed state', function () {
                                                expect(scope.state.name).toEqual('confirmed');
                                            });
                                        });
                                    });

                                    describe('on submit', function () {
                                        beforeEach(function () {
                                            scope.state.price = 1.24999;
                                            scope.submit();
                                        });

                                        it('is working', function () {
                                            expect(scope.working).toBeTruthy();
                                        });

                                        it('update catalog is requested', function () {
                                            expect(updateCatalogItem).toHaveBeenCalledWith({
                                                data: {
                                                    id: 'id',
                                                    type: 'type',
                                                    price: 125,
                                                    context: 'update'
                                                },
                                                success: jasmine.any(Function),
                                                error: jasmine.any(Function)
                                            });
                                        });

                                        describe('on update success', function () {
                                            beforeEach(function () {
                                                updateCatalogItem.calls.mostRecent().args[0].success();
                                            });

                                            it('edit-mode renderer is closed', function () {
                                                expect(edit.close).toHaveBeenCalled();
                                            });

                                            it('onUpdate handler is executed', function () {
                                                expect(onUpdateSpy).toHaveBeenCalled();
                                            });
                                        });

                                        describe('on update error', function () {
                                            beforeEach(function () {
                                                updateCatalogItem.calls.mostRecent().args[0].error();
                                            });

                                            it('is in error state', function () {
                                                expect(scope.state.name).toEqual('error');
                                            });

                                            it('is not working', function () {
                                                expect(scope.working).toBeFalsy();
                                            });
                                        });
                                    });
                                });

                                describe('when vatOnPriceInterpretedAs is included without item unit price', function () {
                                    beforeEach(function () {
                                        $ctrl.item.unitPrice = undefined;
                                        $ctrl.item.unitPriceInclVat = undefined;
                                        settings.vatOnPriceInterpretedAs = 'included';
                                        priceSettings.getPriceSettingsDeferred.resolve(settings);
                                        scope.$digest();
                                    });

                                    it('price is derived from item price', function () {
                                        expect(scope.state.price).toEqual(1.1);
                                    });
                                });

                                describe('when vatOnPriceInterpretedAs is not included', function () {
                                    beforeEach(function () {
                                        settings.vatOnPriceInterpretedAs = '';
                                        priceSettings.getPriceSettingsDeferred.resolve(settings);
                                        scope.$digest();
                                    });

                                    it('vatOnPrice is enabled', function () {
                                        expect(scope.state.vatOnPrice).toBeFalsy();
                                    });

                                    it('price is derived from item price', function () {
                                        expect(scope.state.price).toEqual(1.1);
                                    });

                                    describe('on toggleVatOnPrice', function () {
                                        beforeEach(function () {
                                            scope.state.toggleVatOnPrice();
                                        });

                                        it('request is made for updateVatOnPriceInterpretedAs', function () {
                                            expect(priceSettings.updateVatOnPriceInterpretedAs).toHaveBeenCalledWith('excluded');
                                        });
                                    });
                                });

                                describe('with settings', function () {
                                    beforeEach(function () {
                                        priceSettings.getPriceSettingsDeferred.resolve(settings);
                                        scope.$digest();
                                    });

                                    it('is in confirmed state', function () {
                                        expect(scope.state.name).toEqual('confirmed');
                                    });

                                    it('currency is available', function () {
                                        expect(scope.state.currency).toEqual(settings.currency);
                                    });

                                    describe('on close', function () {
                                        beforeEach(function () {
                                            scope.state.close();
                                        });

                                        it('edit-mode renderer is closed', function () {
                                            expect(edit.close).toHaveBeenCalled();
                                        });
                                    });
                                });
                            });

                            describe('and price settings could not be loaded', function () {
                                beforeEach(function () {
                                    priceSettings.getPriceSettingsDeferred.reject();
                                    scope.$digest();
                                });

                                it('is in error state', function () {
                                    expect(scope.state.name).toEqual('error');
                                });
                            });
                        });
                    });

                    describe('on catalog item changes', function () {
                        beforeEach(function () {
                            catalogItem.presentableUnitPrice = 'price';
                            $ctrl.$onChanges();
                        });

                        it('component is in update state', function () {
                            expect($ctrl.state.name).toEqual('update');
                        });

                        it('exposes the presentable unit price as price', function () {
                            expect($ctrl.price).toEqual(catalogItem.presentableUnitPrice);
                        });
                    });
                });

                describe('with presentableUnitPrice on catalog item', function () {
                    beforeEach(function () {
                        catalogItem.presentableUnitPrice = 'price';
                    });

                    describe('when in edit mode', function () {
                        beforeEach(function () {
                            topics.subscribe.calls.mostRecent().args[1](true);
                        });

                        it('component is in update state', function () {
                            catalogItem.presentableUnitPrice = 'price';
                            expect($ctrl.state.name).toEqual('update');
                        });
                    });
                });

                describe('on destroy', function () {
                    var listener;

                    beforeEach(function () {
                        listener = topics.subscribe.calls.mostRecent().args[1];
                        $ctrl.$onDestroy();
                    });

                    it('edit.mode event is unsubscribed', function () {
                        expect(topics.unsubscribe.calls.mostRecent().args[0]).toEqual('edit.mode');
                        expect(topics.unsubscribe.calls.mostRecent().args[1]).toEqual(listener);
                    });

                    it('not observing profile anymore', function () {
                        topics.subscribe.calls.reset();
                        binarta.checkpoint.profile.refresh();
                        expect(topics.subscribe).not.toHaveBeenCalled();
                    });
                });
            });

            describe('when user is logged out', function () {
                beforeEach(function () {
                    $ctrl.$onInit();
                    binarta.checkpoint.profile.signout();
                });

                it('component is in readOnly state', function () {
                    expect($ctrl.state.name).toEqual('readOnly');
                });
            });
        });
    });
});