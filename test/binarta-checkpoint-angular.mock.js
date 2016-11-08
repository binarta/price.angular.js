angular.module('binarta-checkpointjs-angular1', [])
    .service('binarta', function () {
        this.checkpoint = {
            profile: {
                hasPermission: jasmine.createSpy('hasPermission')
            }
        }
    });