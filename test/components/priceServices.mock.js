angular.module('bin.price.services', [])
    .service('binPriceSettings', ['$q', function ($q) {
        this.getPriceSettingsDeferred = $q.defer();
        this.getPriceSettings = jasmine.createSpy('getPriceSettings').and.returnValue(this.getPriceSettingsDeferred.promise);

        this.getPriceConfigDeferred = $q.defer();
        this.getPriceConfig = jasmine.createSpy('getPriceConfig').and.returnValue(this.getPriceConfigDeferred.promise);

        this.updatePriceConfigDeferred = $q.defer();
        this.updatePriceConfig = jasmine.createSpy('getPriceConfig').and.returnValue(this.updatePriceConfigDeferred.promise);

        this.updateVatOnPriceInterpretedAsDeferred = $q.defer();
        this.updateVatOnPriceInterpretedAs = jasmine.createSpy('updateVatOnPriceInterpretedAs').and.returnValue(this.updateVatOnPriceInterpretedAsDeferred.promise);
    }]);