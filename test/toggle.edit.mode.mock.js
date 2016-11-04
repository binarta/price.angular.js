angular.module('toggle.edit.mode', [])
    .service('editMode', function () {
        this.bindEvent = jasmine.createSpy('bindEvent');
        this.enable = jasmine.createSpy('enable');
    })
    .service('editModeRenderer', function () {
        this.open = jasmine.createSpy('open');
        this.close = jasmine.createSpy('close');
    });