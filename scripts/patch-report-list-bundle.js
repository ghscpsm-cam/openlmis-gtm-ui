'use strict';

const fs = require('fs');

const bundlePath = process.argv[2];

if (!bundlePath) {
    throw new Error('Usage: node scripts/patch-report-list-bundle.js <openlmis.js>');
}

const originalController = `function controller(loadingModalService,reportCategories,jasperReports,dashboardReportsList){var vm=this;vm.result={},vm.$onInit=function(){loadingModalService.open(),vm.reportCategories.forEach((function(category){vm.result[category.name]=[]})),vm.jasperReports.forEach((function(element){element.uisref=".generate({module: report.$module, report: report.id})",element.category||(element.category={name:"Default Category"}),vm.result[element.category.name].push(element)})),vm.dashboardReportsList.forEach((function(element){element.uisref="openlmis.reports.list.dashboard.view({reportId: '"+element.id+"'})",vm.result[element.category.name].push(element)})),loadingModalService.close()},vm.reportCategories=reportCategories,vm.jasperReports=jasperReports,vm.dashboardReportsList=dashboardReportsList}angular.module("report").controller("ReportListController",controller),controller.$inject=["loadingModalService","reportCategories","jasperReports","dashboardReportsList"]`;

const filteredController = `function controller(loadingModalService,reportCategories,jasperReports,dashboardReportsList,currentUserService,facilityService){var vm=this,categoryByFacilityCode={BCB00001:"Reportes DABMA",BCA00001:"Reportes Departamento de Almacén",BCM00002:"Reportes Bodega de Medicamentos",BCS00003:"Reportes Bodega de Suministros",BCD00004:"Reportes Bodega de Donaciones"};function sortReports(warehouseCategoryName){var warehouseUser=!!warehouseCategoryName,commonCategoryName="Default Category";vm.result={};warehouseUser?(vm.result[warehouseCategoryName]=[],vm.result[commonCategoryName]=[]):vm.reportCategories.forEach((function(category){vm.result[category.name]=[]})),vm.jasperReports.forEach((function(report){var categoryName;report.uisref=".generate({module: report.$module, report: report.id})",categoryName=report.category?report.category.name:"Default Category",(!warehouseUser||categoryName===warehouseCategoryName||categoryName===commonCategoryName)&&vm.result[categoryName]&&vm.result[categoryName].push(report)})),warehouseUser||vm.dashboardReportsList.forEach((function(report){report.uisref="openlmis.reports.list.dashboard.view({reportId: '"+report.id+"'})",report.category&&vm.result[report.category.name]&&vm.result[report.category.name].push(report)}))}vm.result={},vm.$onInit=function(){loadingModalService.open(),currentUserService.getUserInfo().then((function(user){return user.homeFacilityId?facilityService.get(user.homeFacilityId).then((function(homeFacility){var categoryName=categoryByFacilityCode[homeFacility.code];categoryName?sortReports(categoryName):vm.result={}})):void sortReports()})).catch((function(){vm.result={}})).finally(loadingModalService.close)},vm.reportCategories=reportCategories,vm.jasperReports=jasperReports,vm.dashboardReportsList=dashboardReportsList}angular.module("report").controller("ReportListController",controller),controller.$inject=["loadingModalService","reportCategories","jasperReports","dashboardReportsList","currentUserService","facilityService"]`;

const bundle = fs.readFileSync(bundlePath, 'utf8');
const occurrences = bundle.split(originalController).length - 1;

if (occurrences !== 1) {
    throw new Error(`Expected exactly one standard ReportListController, found ${occurrences}. The GTM base image may have changed.`);
}

fs.writeFileSync(bundlePath, bundle.replace(originalController, filteredController));

const patched = fs.readFileSync(bundlePath, 'utf8');
['Reportes DABMA', 'commonCategoryName', 'Tarjeta de Almacén para'].forEach((value) => {
    if (!patched.includes(value)) {
        throw new Error(`Patched bundle is missing required value: ${value}`);
    }
});

console.log('ReportListController patched and GTM translations verified.');
