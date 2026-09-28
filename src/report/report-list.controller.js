/*
 * This program is part of the OpenLMIS logistics management information system platform software.
 * Copyright © 2017 VillageReach
 *
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU Affero General Public License for more details. You should have received a copy of
 * the GNU Affero General Public License along with this program. If not, see
 * http://www.gnu.org/licenses.  For additional information contact info@OpenLMIS.org. 
 */

(function() {

    'use strict';

    angular
        .module('report')
        .controller('ReportListController', controller);

    controller.$inject = [
        'loadingModalService', 'reportCategories', 'jasperReports', 'dashboardReportsList',
        'currentUserService', 'facilityService'
    ];

    function controller(loadingModalService, reportCategories, jasperReports,
                        dashboardReportsList, currentUserService, facilityService) {
        var vm = this,
            categoryByFacilityCode = {
                BCB00001: 'Reportes DABMA',
                BCA00001: 'Reportes Departamento de Almacén',
                BCM00002: 'Reportes Bodega de Medicamentos',
                BCS00003: 'Reportes Bodega de Suministros',
                BCD00004: 'Reportes Bodega de Donaciones'
            };

        vm.result = {};
        vm.reportCategories = reportCategories;
        vm.jasperReports = jasperReports;
        vm.dashboardReportsList = dashboardReportsList;

        vm.$onInit = onInit;

        function onInit() {
            loadingModalService.open();

            currentUserService.getUserInfo()
                .then(function(user) {
                    if (!user.homeFacilityId) {
                        sortReports();
                        return;
                    }

                    return facilityService.get(user.homeFacilityId).then(function(homeFacility) {
                        var categoryName = categoryByFacilityCode[homeFacility.code];

                        if (categoryName) {
                            sortReports(categoryName);
                        } else {
                            vm.result = {};
                        }
                    });
                })
                .catch(function() {
                    // Fail closed: requiredRights still protects generation, and the
                    // list must not reveal another warehouse's report names.
                    vm.result = {};
                })
                .finally(loadingModalService.close);
        }

        function sortReports(warehouseCategoryName) {
            var warehouseUser = !!warehouseCategoryName,
                commonCategoryName = 'Default Category';

            vm.result = {};

            if (warehouseUser) {
                vm.result[warehouseCategoryName] = [];
                vm.result[commonCategoryName] = [];
            } else {
                vm.reportCategories.forEach(function(category) {
                    vm.result[category.name] = [];
                });
            }

            vm.jasperReports.forEach(function(report) {
                var categoryName;

                report.uisref = '.generate({module: report.$module, report: report.id})';
                categoryName = report.category ? report.category.name : 'Default Category';

                if ((!warehouseUser || categoryName === warehouseCategoryName ||
                    categoryName === commonCategoryName) && vm.result[categoryName]) {
                    vm.result[categoryName].push(report);
                }
            });

            // Warehouse users receive their warehouse reports plus common
            // Jasper reports. Administrators without a mapped home facility
            // retain the standard dashboard report list.
            if (!warehouseUser) {
                vm.dashboardReportsList.forEach(function(report) {
                    report.uisref = 'openlmis.reports.list.dashboard.view({reportId: \'' +
                        report.id + '\'})';

                    if (report.category && vm.result[report.category.name]) {
                        vm.result[report.category.name].push(report);
                    }
                });
            }
        }
    }
})();
