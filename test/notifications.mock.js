angular.module('notifications', [])
    .factory('topicRegistry', function () {
        return jasmine.createSpyObj('topicRegistry', ['subscribe', 'unsubscribe']);
    });