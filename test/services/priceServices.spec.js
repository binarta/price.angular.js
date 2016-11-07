describe('bin.price', function () {
    beforeEach(module('bin.price.services'));

    var $rootScope, rest, restDeferred, applicationData, config;
    var configReader, configReaderDeferred, configWriter, configWriterDeferred;

    beforeEach(inject(function ($q, _$rootScope_, restServiceHandler, applicationDataService, _config_, _configReader_, _configWriter_) {
        $rootScope = _$rootScope_;
        rest = restServiceHandler;
        applicationData = applicationDataService;
        config = _config_;

        configReaderDeferred  = $q.defer();
        configReader = _configReader_;
        configReader.and.returnValue(configReaderDeferred.promise);

        configWriterDeferred  = $q.defer();
        configWriter = _configWriter_;
        configWriter.and.returnValue(configWriterDeferred.promise);

        config.baseUri = 'baseUri/';
        config.namespace = 'namespace';

        restDeferred = $q.defer();
        rest.and.returnValue(restDeferred.promise);
    }));
    
    describe('binPriceSettings service', function () {
        var sut;

        beforeEach(inject(function (binPriceSettings) {
            sut = binPriceSettings;
        }));

        describe('on getCountryCode', function () {
            var resolved, rejected;

            beforeEach(function () {
                sut.getCountryCode().then(function (result) {
                    resolved = result;
                }, function () {
                    rejected = true;
                });
            });

            it('read config value', function () {
                expect(configReader).toHaveBeenCalledWith({key: 'shop.country.code'});
            });

            describe('on success', function () {
                beforeEach(function () {
                    configReaderDeferred.resolve({data:{value: 'CODE'}});
                    $rootScope.$digest();
                });

                it('code is resolved', function () {
                    expect(resolved).toEqual('CODE');
                });

                it('config reader is only called once', function () {
                    sut.getCountryCode();
                    sut.getCountryCode();
                    sut.getCountryCode();

                    expect(configReader.calls.count()).toEqual(1);
                });
            });

            it('on rejected', function () {
                configReaderDeferred.reject();
                $rootScope.$digest();

                expect(resolved).toEqual('');
            });
        });

        describe('on getVatRate', function () {
            var resolved, rejected;

            beforeEach(function () {
                sut.getVatRate().then(function (result) {
                    resolved = result;
                }, function () {
                    rejected = true;
                });
            });

            it('read config value', function () {
                expect(configReader).toHaveBeenCalledWith({key: 'shop.default.vat.rate'});
            });

            describe('on success', function () {
                beforeEach(function () {
                    configReaderDeferred.resolve({data:{value: 0.21}});
                    $rootScope.$digest();
                });

                it('code is resolved', function () {
                    expect(resolved).toEqual(21);
                });

                it('config reader is only called once', function () {
                    sut.getVatRate();
                    sut.getVatRate();
                    sut.getVatRate();

                    expect(configReader.calls.count()).toEqual(1);
                });
            });

            it('on rejected', function () {
                configReaderDeferred.reject();
                $rootScope.$digest();

                expect(resolved).toEqual(0);
            });
        });

        describe('on getCurrency', function () {
            var actual;

            describe('and no currency in application data', function () {

                beforeEach(function () {
                    applicationData.then.and.callFake(function (listener) {
                        listener({});
                    });

                    sut.getCurrency().then(function (c) {
                        actual = c;
                    });

                    $rootScope.$digest();
                });

                it('fallback to euro', function () {
                    expect(actual).toEqual({code: 'EUR', symbol: '€'});
                });
            });

            describe('and currency is in application data', function () {
                var expected = {
                    code: 'CUR',
                    symbol: 'C'
                };

                beforeEach(function () {
                    applicationData.then.and.callFake(function (listener) {
                        listener({currency: expected});
                    });

                    sut.getCurrency().then(function (c) {
                        actual = c;
                    });

                    $rootScope.$digest();
                });

                it('return currency', function () {
                    sut.getCurrency().then(function (c) {
                        expect(actual).toEqual(expected);
                    });
                });
            });
        });
        
        describe('on getVatOnPriceInterpretedAs', function () {
            var resolved;

            beforeEach(function () {
                sut.getVatOnPriceInterpretedAs().then(function (result) {
                    resolved = result;
                });
            });

            it('read config value', function () {
                expect(configReader).toHaveBeenCalledWith({key: 'shop.vat.on.price.interpreted.as'});
            });

            describe('on success', function () {
                beforeEach(function () {
                    configReaderDeferred.resolve({data:{value: 'included'}});
                    $rootScope.$digest();
                });

                it('value is resolved', function () {
                    expect(resolved).toEqual('included');
                });

                it('config reader is only called once', function () {
                    sut.getVatOnPriceInterpretedAs();
                    sut.getVatOnPriceInterpretedAs();

                    expect(configReader.calls.count()).toEqual(1);
                });
            });

            it('on rejected', function () {
                configReaderDeferred.reject();
                $rootScope.$digest();

                expect(resolved).toEqual('excluded');
            });
        });
        
        describe('on getCurrencies', function () {
            var currencies;

            beforeEach(function () {
                sut.getCurrencies().then(function (c) {
                    currencies = c;
                });
            });

            it('execute call', function () {
                expect(rest).toHaveBeenCalledWith({
                    params: {
                        method: 'GET',
                        url: 'baseUri/api/usecase?h.usecase=find.all.supported.currencies',
                        withCredentials: true
                    }
                });
            });

            describe('on success', function () {
                var c = [
                    {
                        "code": "AED"
                    },
                    {
                        "code": "ALL"
                    },
                    {
                        "code": "AMD"
                    },
                    {
                        "code": "ANG"
                    },
                    {
                        "code": "AOA"
                    }
                ];

                beforeEach(function () {
                    restDeferred.resolve({data: c});
                    $rootScope.$digest();
                });

                it('currencies are available', function () {
                    expect(currencies).toEqual(c);
                });

                it('subsequent calls does not trigger rest call', function () {
                    rest.calls.reset();
                    sut.getCurrencies();
                    expect(rest).not.toHaveBeenCalled();
                });
            });
        });

        describe('on getCountries', function () {
            var resolved;

            beforeEach(function () {
                config.countries = [{country:'Albania', code:'AL'},{country:'Algeria', code:'DZ'},{country:'Argentina', code:'AR'}];

                sut.getCountries().then(function (result) {
                    resolved = result;
                });
                $rootScope.$digest();
            });

            it('countries are available', function () {
                expect(resolved).toEqual(config.countries);
            });
        });

        describe('on getVatRates', function () {
            var resolved;

            beforeEach(function () {
                config.euVatRates = {
                    rates: {'BE':{'country':'Belgium','standard_rate':21}}
                };

                sut.getVatRates().then(function (result) {
                    resolved = result;
                });
                $rootScope.$digest();
            });

            it('vatRates are available', function () {
                expect(resolved).toEqual(config.euVatRates.rates);
            });
        });

        describe('on getPriceSettings', function () {
            var getVatOnPriceInterpretedAsDeferred, getCountryCodeDeferred, getDefaultVatRateDeferred, getCurrencyDeferred, settings;

            beforeEach(inject(function ($q) {
                getVatOnPriceInterpretedAsDeferred = $q.defer();
                sut.getVatOnPriceInterpretedAs = jasmine.createSpy('getVatOnPriceInterpretedAsDeferred').and.returnValue(getVatOnPriceInterpretedAsDeferred.promise);
                getCountryCodeDeferred = $q.defer();
                sut.getCountryCode = jasmine.createSpy('getCountryCode').and.returnValue(getCountryCodeDeferred.promise);
                getDefaultVatRateDeferred = $q.defer();
                sut.getVatRate = jasmine.createSpy('getDefaultVatRate').and.returnValue(getDefaultVatRateDeferred.promise);
                getCurrencyDeferred = $q.defer();
                sut.getCurrency = jasmine.createSpy('getCurrency').and.returnValue(getCurrencyDeferred.promise);

                settings = undefined;

                sut.getPriceSettings().then(function (result) {
                    settings = result;
                });
            }));

            describe('on success', function () {
                beforeEach(function () {
                    getVatOnPriceInterpretedAsDeferred.resolve('included');
                    getCountryCodeDeferred.resolve('CODE');
                    getDefaultVatRateDeferred.resolve('RATE');
                    getCurrencyDeferred.resolve({code:'CUR', symbol:'S'});

                    $rootScope.$digest();
                });

                it('settings are available', function () {
                    expect(settings).toEqual({
                        vatOnPriceInterpretedAs: 'included',
                        currency: {code:'CUR', symbol:'S'},
                        status: 'confirmed'
                    });
                });
            });

            describe('on success with empty countryCode', function () {
                beforeEach(function () {
                    getVatOnPriceInterpretedAsDeferred.resolve('included');
                    getCountryCodeDeferred.resolve('');
                    getDefaultVatRateDeferred.resolve('RATE');
                    getCurrencyDeferred.resolve({code:'CUR', symbol:'S'});

                    $rootScope.$digest();
                });

                it('status is unconfirmed', function () {
                    expect(settings).toEqual({
                        status: 'unconfirmed'
                    });
                });
            });

            describe('when one of the values is rejected', function () {
                beforeEach(function () {
                    getVatOnPriceInterpretedAsDeferred.resolve('included');
                    getCountryCodeDeferred.reject();
                    getDefaultVatRateDeferred.resolve('RATE');
                    getCurrencyDeferred.reject();

                    $rootScope.$digest();
                });

                it('status is unconfirmed', function () {
                    expect(settings).toEqual({
                        status: 'unconfirmed'
                    });
                });
            });

        });

        describe('on updateCountryCode', function () {
            var updated;

            beforeEach(function () {
                sut.getCountryCode();
                configReaderDeferred.resolve({data:{value: 'CODE'}});
                $rootScope.$digest();

                sut.updateCountryCode('NEW CODE').then(function () {
                    updated = true;
                }, function () {
                    updated = false;
                });
            });

            it('write config value', function () {
                expect(configWriter).toHaveBeenCalledWith({key: 'shop.country.code', value: 'NEW CODE'});
            });

            describe('on success', function () {
                beforeEach(function () {
                    configWriterDeferred.resolve();
                    $rootScope.$digest();
                });

                it('is updated', function () {
                    expect(updated).toEqual(true);
                });

                describe('on requesting country code', function () {
                    beforeEach(function () {
                        configReader.calls.reset();
                        sut.getCountryCode();
                    });

                    it('new value is requested', function () {
                        expect(configReader.calls.count()).toEqual(1);
                    });
                });
            });

            it('on rejected', function () {
                configWriterDeferred.reject('reason');
                $rootScope.$digest();

                expect(updated).toEqual(false);
            });
        });

        describe('on updateVatRate', function () {
            var updated;

            beforeEach(function () {
                sut.getVatRate();

                sut.updateVatRate(10).then(function () {
                    updated = true;
                }, function () {
                    updated = false;
                });
            });

            it('write config value', function () {
                expect(configWriter).toHaveBeenCalledWith({key: 'shop.default.vat.rate', value: 0.1});
            });

            describe('on success', function () {
                beforeEach(function () {
                    configWriterDeferred.resolve();
                    $rootScope.$digest();
                });

                it('is updated', function () {
                    expect(updated).toEqual(true);
                });

                describe('on requesting vat rate', function () {
                    beforeEach(function () {
                        configReader.calls.reset();
                        sut.getVatRate();
                    });

                    it('new value is requested', function () {
                        expect(configReader.calls.count()).toEqual(1);
                    });
                });
            });

            it('on rejected', function () {
                configWriterDeferred.reject('reason');
                $rootScope.$digest();

                expect(updated).toEqual(false);
            });

            describe('with invalid vat rate', function () {
                beforeEach(function () {
                    configWriter.calls.reset();
                    sut.updateVatRate();
                });

                it('fallback to 0', function () {
                    expect(configWriter).toHaveBeenCalledWith({key: 'shop.default.vat.rate', value: 0});
                });
            });
        });

        describe('on updateCurrency', function () {
            var resolved, rejected;

            beforeEach(function () {
                sut.updateCurrency('NEW').then(function () {
                    resolved = true;
                }, function () {
                    rejected = true;
                });
            });

            it('active currency is persisted', function () {
                expect(rest.calls.mostRecent().args[0]).toEqual({
                    params: {
                        method: 'POST',
                        url: 'baseUri/api/usecase',
                        withCredentials: true,
                        data: {
                            headers: {
                                usecase: 'set.active.currency'
                            },
                            payload: {
                                currency: 'NEW'
                            }
                        }
                    }
                });
            });

            describe('on success', function () {
                var getDeferred;

                beforeEach(inject(function ($q) {
                    getDeferred = $q.defer();
                    rest.and.returnValue(getDeferred.promise);

                    restDeferred.resolve();
                    $rootScope.$digest();
                }));

                it('get new active currency', function () {
                    expect(rest.calls.mostRecent().args[0]).toEqual({
                        params: {
                            method: 'GET',
                            url: 'baseUri/api/usecase?h.usecase=get.active.currency&h.namespace=namespace'
                        }
                    });
                });

                describe('on get new active currency success', function () {
                    beforeEach(function () {
                        getDeferred.resolve({});
                        $rootScope.$digest();
                    });

                    it('updateCurrency is resolved', function () {
                        expect(resolved).toBeTruthy();
                    });
                });

                describe('on get new active currency rejected', function () {
                    beforeEach(function () {
                        getDeferred.reject();
                        $rootScope.$digest();
                    });

                    it('updateCurrency is rejected', function () {
                        expect(rejected).toBeTruthy();
                    });
                });

                describe('calling get active currency again', function () {
                    var actual;

                    beforeEach(function () {
                        getDeferred.resolve({data: {code: 'UPDATED'}});
                        $rootScope.$digest();
                        sut.getCurrency().then(function (c) {
                            actual = c;
                        });
                        $rootScope.$digest();
                    });

                    it('returns new currency', function () {
                        expect(actual).toEqual({code: 'UPDATED'});
                    });
                });
            });
        });

        describe('on updateVatOnPriceInterpretedAs', function () {
            var updated;

            beforeEach(function () {
                sut.getVatOnPriceInterpretedAs();

                sut.updateVatOnPriceInterpretedAs('included').then(function () {
                    updated = true;
                }, function () {
                    updated = false;
                });
            });

            it('write config value', function () {
                expect(configWriter).toHaveBeenCalledWith({key: 'shop.vat.on.price.interpreted.as', value: 'included'});
            });

            describe('on success', function () {
                beforeEach(function () {
                    configWriterDeferred.resolve();
                    $rootScope.$digest();
                });

                it('is updated', function () {
                    expect(updated).toEqual(true);
                });

                describe('on requesting value', function () {
                    beforeEach(function () {
                        configReader.calls.reset();
                        sut.getVatOnPriceInterpretedAs();
                    });

                    it('new value is requested', function () {
                        expect(configReader.calls.count()).toEqual(1);
                    });
                });
            });

            it('on rejected', function () {
                configWriterDeferred.reject('reason');
                $rootScope.$digest();

                expect(updated).toEqual(false);
            });
        });

        describe('on updatePriceConfig', function () {
            var updateCountryCodeDeferred, updateDefaultVatRateDeferred, updateActiveCurrencyDeferred, resolved, rejected;

            beforeEach(inject(function ($q) {
                updateCountryCodeDeferred = $q.defer();
                sut.updateCountryCode = jasmine.createSpy('updateCountryCode').and.returnValue(updateCountryCodeDeferred.promise);
                updateDefaultVatRateDeferred = $q.defer();
                sut.updateVatRate = jasmine.createSpy('updateDefaultVatRate').and.returnValue(updateDefaultVatRateDeferred.promise);
                updateActiveCurrencyDeferred = $q.defer();
                sut.updateCurrency = jasmine.createSpy('updateActiveCurrency').and.returnValue(updateActiveCurrencyDeferred.promise);

                sut.updatePriceConfig({
                    country: 'country',
                    vatRate: 'vat',
                    currency: {
                        code: 'CUR'
                    }
                }).then(function (result) {
                    resolved = result;
                }, function () {
                    rejected = true;
                });
            }));

            it('update values', function () {
                expect(sut.updateCountryCode).toHaveBeenCalledWith('country');
                expect(sut.updateVatRate).toHaveBeenCalledWith('vat');
                expect(sut.updateCurrency).toHaveBeenCalledWith('CUR');
            });

            it('on success', function () {
                updateCountryCodeDeferred.resolve();
                updateDefaultVatRateDeferred.resolve();
                updateActiveCurrencyDeferred.resolve();

                $rootScope.$digest();

                expect(resolved).toEqual({
                    country: 'country',
                    vatRate: 'vat',
                    currency: {
                        code: 'CUR'
                    },
                    status: 'confirmed'
                });
            });

            it('on rejected', function () {
                updateCountryCodeDeferred.reject();

                $rootScope.$digest();

                expect(rejected).toBeTruthy();
            });
        });
    });
});