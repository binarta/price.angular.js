angular.module('application', [])
    .service('applicationDataService', function () {
        this.then = jasmine.createSpy('applicationDataService');
    });