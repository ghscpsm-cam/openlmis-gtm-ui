# OpenLMIS Reference UI
The OpenLMIS Reference UI is the user interface for the OpenLMIS Reference Distribution. This user interface is designed to be a single page web application that is optimized for offline and low-bandwidth environments.

Multiple UI modules are compiled together with the OpenLMIS dev-ui to create the OpenLMIS Reference-UI. UI modules included in the OpenLMIS Reference-UI are:
* [OpenLMIS Auth UI](https://github.com/OpenLMIS/openlmis-auth-ui)
* [OpenLMIS Fulfillment UI](https://github.com/OpenLMIS/openlmis-fulfillment-ui)
* [OpenLMIS Reference Data UI](https://github.com/OpenLMIS/openlmis-referencedata-ui)
* [OpenLMIS Report UI](https://github.com/OpenLMIS/openlmis-report-ui)
* [OpenLMIS Requisition UI](https://github.com/OpenLMIS/openlmis-requisition-ui)
* [OpenLMIS UI Components](https://github.com/OpenLMIS/openlmis-ui-components)
* [OpenLMIS UI Layout](https://github.com/OpenLMIS/openlmis-ui-layout)

## Guatemala development deployment

The development UI keeps the translations and stock-management labels from the
versioned GTM image, while restricting warehouse reports according to the
user's home facility. Common reports in `Default Category` remain visible to
all users who have report access.

Run `./deploy-common-reports-ui-dev.sh` to build, publish and activate the
filtered image on `openlmisdev`. The script deliberately fails if the report
controller in the GTM bundle changes, so a new upstream UI version must be
reviewed before it is deployed. The matching image tag must also be pinned in
`openlmis-gua-platform/overrides/openlmis-ref-distro.yml`.
