angular.module("bin.price.templates").run(["$templateCache", function($templateCache) {$templateCache.put("bin-price-edit.html","<form name=\"bin-edit-form\" ng-submit=\"submit()\"><div class=\"bin-menu-edit-body\"><div ng-if=\"!state.name\"><i class=\"fa fa-spinner fa-spin\"></i></div><div class=\"alert alert-danger\" ng-if=\"state.name == \'error\'\" i18n=\"\" code=\"price.generic.error\" read-only=\"\"><i class=\"fa fa-exclamation-triangle fa-fw\"></i> <span ng-bind=\"::var\"></span></div><div ng-if=\"state.name == \'confirmed\'\"><div class=\"form-group\"><label for=\"catalogItemPrice\" i18n=\"\" code=\"price.label\" read-only=\"\" ng-bind=\"::var\"></label> <small ng-if=\"state.vatOnPrice == 1\" i18n=\"\" code=\"price.vat.incl.label\" read-only=\"\" ng-bind=\"::var\"></small> <small ng-if=\"state.vatOnPrice == 0\" i18n=\"\" code=\"price.vat.excl.label\" read-only=\"\" ng-bind=\"::var\"></small><div class=\"input-group\"><div class=\"input-group-addon\" ng-bind=\"::state.currency.symbol\"></div><input type=\"number\" min=\"0\" step=\"any\" name=\"catalogItemPrice\" id=\"catalogItemPrice\" ng-model=\"state.price\" autofocus=\"\"></div><div class=\"help-block text-danger\" ng-repeat=\"v in violations[\'price\']\" i18n=\"\" code=\"price.{{::v}}\" default=\"{{::v}}\" read-only=\"\" ng-bind=\"::var\"></div></div><div class=\"form-group\"><div class=\"row\"><div class=\"col-xs-12 col-sm-6\"><table class=\"table\"><tr><th i18n=\"\" code=\"price.vat.included.label\" read-only=\"\" ng-bind=\"::var\"></th><td><div class=\"checkbox-switch\" ng-show=\"state.vatOnPrice != undefined\"><input type=\"checkbox\" id=\"vat-on-price-switch\" ng-model=\"state.vatOnPrice\" ng-change=\"state.toggleVatOnPrice()\"> <label for=\"vat-on-price-switch\"></label></div></td></tr></table></div></div></div></div><div ng-if=\"state.name == \'unconfirmed\' || state.name == \'config\'\"><div class=\"form-group\" ng-class=\"{\'has-error\': form[\'config-vat-rate-country-code\'].$invalid}\"><label i18n=\"\" code=\"price.config.vat.country.code.label\" read-only=\"\" for=\"config-vat-rate-country-code\" ng-bind=\"::var\"></label><div class=\"row\"><div class=\"col-xs-12 col-sm-6\"><select class=\"form-control\" id=\"config-vat-rate-country-code\" name=\"config-vat-rate-country-code\" ng-model=\"state.country\" ng-change=\"state.getStandardVatRate()\" ng-options=\"c.code as c.country for c in state.countries\" required=\"\"></select></div></div></div><div class=\"form-group\" ng-class=\"{\'has-error\': form[\'config-vat-rate\'].$invalid}\"><label i18n=\"\" code=\"price.config.vat.rate.label\" read-only=\"\" for=\"config-vat-rate\" ng-bind=\"::var\"></label><div class=\"row\"><div class=\"col-xs-12 col-sm-3\"><div class=\"input-group\"><input type=\"number\" min=\"0\" max=\"100\" class=\"form-control\" id=\"config-vat-rate\" name=\"config-vat-rate\" ng-model=\"state.vatRate\"><div class=\"input-group-addon\">%</div></div></div></div></div><div class=\"form-group\" ng-class=\"{\'has-error\': form[\'config-currency\'].$invalid}\"><label i18n=\"\" code=\"price.config.currency.label\" read-only=\"\" for=\"config-currency\" ng-bind=\"::var\"></label><div class=\"row\"><div class=\"col-xs-12 col-sm-3\"><div class=\"input-group\"><select class=\"form-control\" id=\"config-currency\" name=\"config-currency\" ng-model=\"state.currency\" ng-options=\"c.code for c in state.currencies track by c.code\" required=\"\"></select></div></div></div></div></div></div><div class=\"bin-menu-edit-actions\"><button ng-if=\"state.submit\" type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"working\" i18n=\"\" code=\"clerk.menu.save.button\" read-only=\"\" ng-bind=\"::var\"></button> <button ng-if=\"state.tryAgain\" type=\"button\" class=\"btn btn-primary\" ng-disabled=\"working\" ng-click=\"state.tryAgain()\" i18n=\"\" code=\"price.try.again.button\" read-only=\"\" ng-bind=\"::var\"></button> <button ng-if=\"state.close\" type=\"reset\" class=\"btn btn-default\" ng-disabled=\"working\" ng-click=\"state.close()\" i18n=\"\" code=\"clerk.menu.close.button\" read-only=\"\" ng-bind=\"::var\"></button> <button ng-if=\"state.cancel\" type=\"reset\" class=\"btn btn-default\" ng-disabled=\"working\" ng-click=\"state.cancel()\" i18n=\"\" code=\"clerk.menu.cancel.button\" read-only=\"\" ng-bind=\"::var\"></button> <button ng-if=\"state.openConfig\" type=\"button\" class=\"btn btn-default pull-left\" ng-disabled=\"working\" ng-click=\"state.openConfig()\" i18n=\"\" code=\"price.config.button\" read-only=\"\" ng-bind=\"::var\"></button></div></form>");}]);