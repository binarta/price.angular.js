(function () {
    angular.module('bin.price.services', ['config', 'application', 'rest.client'])
        .service('binPriceSettings', ['$q', 'config', 'configReader', 'configWriter', 'restServiceHandler', 'applicationDataService', binPriceSettings]);

    function binPriceSettings($q, config, reader, writer, rest, applicationData) {
        var self = this;
        var countryCodeKey = 'shop.country.code';
        var defaultVatRateKey = 'shop.default.vat.rate';
        var vatOnPriceKey = 'shop.vat.on.price.interpreted.as';
        var countryCode, vatRate, currencies, currency, vatOnPriceInterpretedAs;
        var defaultCurrency = {
            code: 'EUR',
            symbol: '€'
        };

        this.getCountryCode = function () {
            if (countryCode) return $q.when(countryCode);
            else return reader({key: countryCodeKey}).then(onSuccess, onError);

            function onSuccess(result) {
                countryCode = result.data.value;
                return countryCode;
            }

            function onError() {
                countryCode = undefined;
                return '';
            }
        };

        this.getVatRate = function () {
            if (vatRate) return $q.when(vatRate);
            else return reader({key: defaultVatRateKey}).then(onSuccess, onError);

            function onSuccess(result) {
                vatRate = result.data.value * 100;
                return vatRate;
            }

            function onError() {
                return 0;
            }
        };

        this.getCurrency = function () {
            if (currency) return $q.when(currency);
            else {
                var deferred = $q.defer();
                applicationData.then(function (data) {
                    currency = data.currency || defaultCurrency;
                    deferred.resolve(currency);
                });
                return deferred.promise;
            }
        };

        this.getVatOnPriceInterpretedAs = function () {
            if (vatOnPriceInterpretedAs) return $q.when(vatOnPriceInterpretedAs);
            else return reader({key: vatOnPriceKey}).then(onSuccess, onError);

            function onSuccess(result) {
                vatOnPriceInterpretedAs = result.data.value;
                return vatOnPriceInterpretedAs;
            }

            function onError() {
                return 'excluded';
            }
        };

        this.getCurrencies = function () {
            if (currencies) return $q.when(currencies);
            else return rest({
                params: {
                    method: 'GET',
                    url: config.baseUri + 'api/usecase?h.usecase=find.all.supported.currencies',
                    withCredentials: true
                }
            }).then(onSuccess);

            function onSuccess(result) {
                currencies = result.data;
                return currencies;
            }
        };

        this.getCountries = function () {
            return $q.when(config.countries);
        };

        this.getVatRates = function () {
            return $q.when((config.euVatRates || {}).rates);
        };

        this.getPriceSettings = function () {
            var unconfirmed = {
                status: 'unconfirmed'
            };

            return $q.all([
                self.getVatOnPriceInterpretedAs(),
                self.getCurrency(),
                self.getCountryCode(),
                self.getVatRate()
            ]).then(function (results) {
                if (results[2] == '') return unconfirmed;
                else return {
                    vatOnPriceInterpretedAs: results[0],
                    currency: results[1],
                    status: 'confirmed'
                };
            }, function () {
                return unconfirmed;
            });
        };

        this.getPriceConfig = function () {
            var deferred = $q.defer();
            $q.all([
                self.getCountryCode(),
                self.getCountries(),
                self.getVatRate(),
                self.getVatRates(),
                self.getCurrency(),
                self.getCurrencies()
            ]).then(function (results) {
                deferred.resolve({
                    country: results[0],
                    countries: results[1],
                    vatRate: results[2],
                    vatRates: results[3],
                    currency: results[4],
                    currencies: results[5]
                });
            }, function () {
                deferred.reject();
            });
            return deferred.promise;
        };

        this.updateCountryCode = function (code) {
            return writer({key: countryCodeKey, value: code}).then(function () {
                countryCode = code;
            });
        };

        this.updateVatRate = function (rate) {
            return writer({key: defaultVatRateKey, value: ((rate || 0) / 100)}).then(function () {
                vatRate = rate;
            });
        };

        this.updateCurrency = function (code) {
            var deferred = $q.defer();
            rest({
                params: {
                    method: 'POST',
                    url: config.baseUri + 'api/usecase',
                    withCredentials: true,
                    data: {
                        headers: {
                            usecase: 'set.active.currency'
                        },
                        payload: {
                            currency: code
                        }
                    }
                }
            }).finally(function () {
                getUpdatedCurrency(function (result) {
                    currency = result.data;
                    deferred.resolve();
                }, function () {
                    deferred.reject();
                });
            });
            return deferred.promise;
        };

        function getUpdatedCurrency(onSuccess, onError) {
            rest({
                params: {
                    method: 'POST',
                    url: config.baseUri + 'api/usecase',
                    data: {
                        headers: {
                            usecase: 'get.active.currency',
                            namespace: config.namespace
                        }
                    }
                }
            }).then(onSuccess, onError);
        }

        this.updateVatOnPriceInterpretedAs = function (value) {
            return writer({key: vatOnPriceKey, value: value}).then(function () {
                vatOnPriceInterpretedAs = value;
            });
        };

        this.updatePriceConfig = function (settings) {
            return $q.all([
                self.updateCountryCode(settings.country),
                self.updateVatRate(settings.vatRate),
                self.updateCurrency(settings.currency.code)
            ]).then(function () {
                settings.status = 'confirmed';
                return settings;
            });
        };
    }
})();