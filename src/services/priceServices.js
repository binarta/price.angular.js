(function () {
    angular.module('bin.price.services', ['config', 'application', 'rest.client'])
        .service('binPriceSettings', ['$q', 'config', 'configReader', 'configWriter', 'restServiceHandler', 'applicationDataService', binPriceSettings]);

    function binPriceSettings($q, config, reader, writer, rest, applicationData) {
        var self = this;
        var countryCodeKey = 'shop.country.code';
        var defaultVatRateKey = 'shop.default.vat.rate';
        var vatOnPriceKey = 'shop.vat.on.price.interpreted.as';
        var countryCodePromise, vatRatePromise, currenciesPromise, currency, vatOnPriceInterpretedAsPromise;
        var defaultCurrency = {
            code: 'EUR',
            symbol: '€'
        };

        this.getCountryCode = function () {
            if (!countryCodePromise) countryCodePromise = reader({key: countryCodeKey}).then(function (result) {
                return result.data.value;
            });
            return countryCodePromise;
        };

        this.getVatRate = function () {
            if (!vatRatePromise) vatRatePromise = reader({key: defaultVatRateKey}).then(function (result) {
                return result.data.value * 100;
            });
            return vatRatePromise;
        };

        this.getCurrency = function () {
            var deferred = $q.defer();
            if (currency) deferred.resolve(currency);
            else {
                applicationData.then(function (data) {
                    currency = data.currency || defaultCurrency;
                    deferred.resolve(currency);
                });
            }
            return deferred.promise;
        };

        this.getVatOnPriceInterpretedAs = function () {
            if (!vatOnPriceInterpretedAsPromise) vatOnPriceInterpretedAsPromise = reader({key: vatOnPriceKey}).then(function (result) {
                return result.data.value;
            }, function () {
                return 'excluded';
            });
            return vatOnPriceInterpretedAsPromise;
        };

        this.getCurrencies = function () {
            if (!currenciesPromise) currenciesPromise = rest({
                params: {
                    method: 'GET',
                    url: config.baseUri + 'api/usecase?h.usecase=find.all.supported.currencies',
                    withCredentials: true
                }
            }).then(function (result) {
                return result.data;
            });
            return currenciesPromise;
        };

        this.getCountries = function () {
            return $q.when(config.countries);
        };

        this.getVatRates = function () {
            return $q.when((config.euVatRates || {}).rates);
        };

        this.getPriceSettings = function () {
            return $q.all([
                self.getVatOnPriceInterpretedAs(),
                self.getCurrency(),
                self.getCountryCode(),
                self.getVatRate()
            ]).then(function (results) {
                return {
                    vatOnPriceInterpretedAs: results[0],
                    currency: results[1],
                    status: 'confirmed'
                };
            }, function () {
                return {
                    status: 'unconfirmed'
                };
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
                countryCodePromise = undefined;
            });
        };

        this.updateVatRate = function (rate) {
            return writer({key: defaultVatRateKey, value: (rate / 100)}).then(function () {
                vatRatePromise = undefined;
            });
        };

        this.updateCurrency = function (code) {
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
                rest({
                    params: {
                        method: 'GET',
                        url: config.baseUri + 'api/usecase?h.usecase=get.active.currency&h.namespace=' + config.namespace
                    }
                }).then(function (result) {
                    currency = result.data;
                });
            });
        };

        this.updateVatOnPriceInterpretedAs = function (value) {
            return writer({key: vatOnPriceKey, value: value}).then(function () {
                vatOnPriceInterpretedAsPromise = undefined;
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