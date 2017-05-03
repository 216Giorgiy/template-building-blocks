describe('networkInterfaceSettings:', () => {
    let rewire = require('rewire');
    let networkInterfaceSettings = rewire('../core/networkInterfaceSettings.js');
    let _ = require('../lodashMixins.js');

    describe('merge:', () => {

        it("validate valid defaults are applied.", () => {
            let settings = [{}];

            let mergedValue = networkInterfaceSettings.mergeWithDefaults(settings);
            expect(mergedValue[0].isPublic).toEqual(false);
            expect(mergedValue[0].subnetName).toEqual("default");
            expect(mergedValue[0].privateIPAllocationMethod).toEqual("Dynamic");
            expect(mergedValue[0].publicIPAllocationMethod).toEqual("Dynamic");
            expect(mergedValue[0].enableIPForwarding).toEqual(false);
            expect(mergedValue[0].domainNameLabelPrefix).toEqual("");
            expect(mergedValue[0].dnsServers.length).toEqual(0);
        });
        it("validate defaults do not override settings.", () => {
            let settings = [{
                "isPublic": true,
                "subnetName": "default1",
                "privateIPAllocationMethod": "Static",
                "publicIPAllocationMethod": "Static",
                "enableIPForwarding": true,
                "domainNameLabelPrefix": "test1",
                "dnsServers": ["10.0.0.0"]
            }];

            let mergedValue = networkInterfaceSettings.mergeWithDefaults(settings);
            expect(mergedValue[0].isPublic).toEqual(true);
            expect(mergedValue[0].subnetName).toEqual("default1");
            expect(mergedValue[0].privateIPAllocationMethod).toEqual("Static");
            expect(mergedValue[0].publicIPAllocationMethod).toEqual("Static");
            expect(mergedValue[0].enableIPForwarding).toEqual(true);
            expect(mergedValue[0].domainNameLabelPrefix).toEqual("test1");
            expect(mergedValue[0].dnsServers.length).toEqual(1);
            expect(mergedValue[0].dnsServers[0]).toEqual("10.0.0.0");
        });
        it("validate additional properties in settings are not removed.", () => {
            let settings = [{
                "name1": "test-as"
            }];

            let mergedValue = networkInterfaceSettings.mergeWithDefaults(settings);
            expect(mergedValue[0].hasOwnProperty("name1")).toEqual(true);
            expect(mergedValue[0].name1).toEqual("test-as");
            expect(mergedValue[0].isPublic).toEqual(false);
            expect(mergedValue[0].subnetName).toEqual("default");
        });
        it("validate missing properties in settings are picked up from defaults.", () => {
            let settings = [{
                "isPublic": true,
                "enableIPForwarding": true,
                "domainNameLabelPrefix": "test1",
                "dnsServers": ["10.0.0.0"]
            }];

            let mergedValue = networkInterfaceSettings.mergeWithDefaults(settings);
            expect(mergedValue[0].isPublic).toEqual(true);
            expect(mergedValue[0].subnetName).toEqual("default");
            expect(mergedValue[0].privateIPAllocationMethod).toEqual("Dynamic");
            expect(mergedValue[0].publicIPAllocationMethod).toEqual("Dynamic");
            expect(mergedValue[0].enableIPForwarding).toEqual(true);
            expect(mergedValue[0].domainNameLabelPrefix).toEqual("test1");
            expect(mergedValue[0].dnsServers.length).toEqual(1);
            expect(mergedValue[0].dnsServers[0]).toEqual("10.0.0.0");
        });
    });
    describe('validations:', () => {
        let nicParam = {
            "isPublic": false,
            "subnetName": "default",
            "privateIPAllocationMethod": "Dynamic",
            "publicIPAllocationMethod": "Dynamic",
            "enableIPForwarding": false,
            "domainNameLabelPrefix": "",
            "dnsServers": [],
            "isPrimary": false
        };
        describe('isPublic:', () => {
            let validation = networkInterfaceSettings.__get__("networkInterfaceValidations").isPublic;
            it("validates only boolean values are valid.", () => {
                let result = validation("yes", nicParam)
                expect(result.result).toEqual(false);

                result = validation(false, nicParam)
                expect(result.result).toEqual(true);
            });
        });
        describe('enableIPForwarding:', () => {
            let validation = networkInterfaceSettings.__get__("networkInterfaceValidations").enableIPForwarding;
            it("validates only boolean values are valid.", () => {
                let result = validation("yes", nicParam)
                expect(result.result).toEqual(false);

                result = validation(false, nicParam)
                expect(result.result).toEqual(true);
            });
        });
        describe('isPrimary:', () => {
            let validation = networkInterfaceSettings.__get__("networkInterfaceValidations").isPrimary;
            it("validates only boolean values are valid.", () => {
                let result = validation("yes", nicParam)
                expect(result.result).toEqual(false);

                result = validation(false, nicParam)
                expect(result.result).toEqual(true);
            });
        });
        describe('privateIPAllocationMethod:', () => {
            let validation = networkInterfaceSettings.__get__("networkInterfaceValidations").privateIPAllocationMethod;
            it("validates valid values are 'Static' and 'Dynamic'.", () => {
                let result = validation("static", nicParam)
                expect(result.result).toEqual(false);

                result = validation(null, nicParam)
                expect(result.result).toEqual(false);

                result = validation("", nicParam)
                expect(result.result).toEqual(false);

                result = validation("Dynamic", nicParam)
                expect(result.result).toEqual(true);
            });
            it("validates if privateIPAllocationMethod is Static, startingIPAddress must be a valid IP address", () => {
                let result = validation("Static", nicParam)
                expect(result.result).toEqual(false);

                let param = _.cloneDeep(nicParam);
                param.startingIPAddress = "10.10.10.10";
                result = validation("Static", param)
                expect(result.result).toEqual(true);
            });
        });
        describe('publicIPAllocationMethod:', () => {
            let validation = networkInterfaceSettings.__get__("networkInterfaceValidations").publicIPAllocationMethod;
            it("validates valid values are 'Static' and 'Dynamic'.", () => {
                let result = validation("static", nicParam)
                expect(result.result).toEqual(false);

                result = validation(null, nicParam)
                expect(result.result).toEqual(false);

                result = validation("", nicParam)
                expect(result.result).toEqual(false);

                result = validation("Static", nicParam)
                expect(result.result).toEqual(true);

                result = validation("Dynamic", nicParam)
                expect(result.result).toEqual(true);
            });
        });
        describe('subnetName:', () => {
            let validation = networkInterfaceSettings.__get__("networkInterfaceValidations").subnetName;
            it("validate name canot be an empty string.", () => {
                let result = validation("", nicParam)
                expect(result).toEqual(false);

                result = validation("test", nicParam)
                expect(result).toEqual(true);

                result = validation(null, nicParam)
                expect(result).toEqual(false);
            });
        });
        describe('dnsServers:', () => {
            let validation = networkInterfaceSettings.__get__("networkInterfaceValidations").dnsServers;
            it("validates that values are valid ip addresses.", () => {
                result = validation("10.0.0.0")
                expect(result).toEqual(true);

                result = validation("test")
                expect(result).toEqual(false);
            });
        });
    });
    describe('transform:', () => {
        let vmIndex = 0;
        let settings = {
            name: "testVM1",
            virtualNetwork: {
                "name": "test-vnet",
                "subscriptionId": "00000000-0000-1000-A000-000000000000",
                "resourceGroupName": "test-rg"
            },
            nics: [
                {
                    "isPublic": false,
                    "subnetName": "web",
                    "privateIPAllocationMethod": "Static",
                    "publicIPAllocationMethod": "Dynamic",
                    "startingIPAddress": "10.0.1.240",
                    "enableIPForwarding": false,
                    "domainNameLabelPrefix": "",
                    "isPrimary": true,
                    "dnsServers": [
                        "10.0.1.240",
                        "10.0.1.242"
                    ],
                    "subscriptionId": "00000000-0000-1100-AA00-000000000000",
                    "resourceGroupName": "test-rg"
                },
                {
                    "isPublic": false,
                    "subnetName": "biz",
                    "privateIPAllocationMethod": "Dynamic",
                    "publicIPAllocationMethod": "Static",
                    "enableIPForwarding": true,
                    "domainNameLabelPrefix": "testDomainName",
                    "isPrimary": false,
                    "dnsServers": [],
                    "subscriptionId": "00000000-0000-1100-AA00-000000000000",
                    "resourceGroupName": "test-rg"
                }
            ]
        };

        it('validates that total number of nics returned equals vmCount multiplied by number of nics in stamp', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, vmIndex);

            expect(result.nics.length).toEqual(2);
        });
        it('validates that nics are named appropriately for each VM', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, vmIndex);

            expect(result.nics.length).toEqual(2);
            expect(result.nics[0].name).toEqual("testVM1-nic1");
            expect(result.nics[1].name).toEqual("testVM1-nic2");
        });
        it('validates that primary nics are correctly assigned for each VM', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, vmIndex);

            expect(result.nics[0].primary).toEqual(true);
            expect(result.nics[1].primary).toEqual(false);
        });
        it('validates that enableIPForwarding is correctly assigned for each VM', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, vmIndex);

            expect(result.nics[0].enableIPForwarding).toEqual(false);
            expect(result.nics[1].enableIPForwarding).toEqual(true);
        });
        it('validates that dnsServers are correctly assigned for each VM', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, vmIndex);

            expect(result.nics[0].dnsSettings.dnsServers.length).toEqual(2);
            expect(result.nics[0].dnsSettings.appliedDnsServers.length).toEqual(2);
            expect(result.nics[0].dnsSettings.dnsServers[0]).toEqual("10.0.1.240");
            expect(result.nics[0].dnsSettings.dnsServers[1]).toEqual("10.0.1.242");
            expect(result.nics[0].dnsSettings.appliedDnsServers[0]).toEqual("10.0.1.240");
            expect(result.nics[0].dnsSettings.appliedDnsServers[1]).toEqual("10.0.1.242");

            expect(result.nics[1].dnsSettings.dnsServers.length).toEqual(0);
            expect(result.nics[1].dnsSettings.appliedDnsServers.length).toEqual(0);
        });
        it('validates that privateIPAllocationMethod is correctly assigned in the Ip configuration', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, vmIndex);

            expect(result.nics[0].ipConfigurations[0].properties.privateIPAllocationMethod).toEqual("Static");
            expect(result.nics[0].ipConfigurations[0].properties.privateIPAddress).toEqual("10.0.1.240");
            expect(result.nics[1].ipConfigurations[0].properties.privateIPAllocationMethod).toEqual("Dynamic");
            expect(result.nics[1].ipConfigurations[0].properties.hasOwnProperty("privateIPAddress")).toEqual(false);
        });
        it('validates that startingIPAddress is correctly computed', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, 5);

            expect(result.nics[0].ipConfigurations[0].properties.privateIPAllocationMethod).toEqual("Static");
            expect(result.nics[0].ipConfigurations[0].properties.privateIPAddress).toEqual("10.0.1.245");
        });
        it('validates that startingIPAddress is correctly computed and rolls over to next octet', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, 18);

            expect(result.nics[0].ipConfigurations[0].properties.privateIPAllocationMethod).toEqual("Static");
            expect(result.nics[0].ipConfigurations[0].properties.privateIPAddress).toEqual("10.0.2.2");
        });
        it('validates that subnets are correctly referenced in the Ip configuration', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, vmIndex);

            expect(result.nics[0].ipConfigurations[0].properties.subnet.id).toEqual("/subscriptions/00000000-0000-1000-A000-000000000000/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/web");
            expect(result.nics[1].ipConfigurations[0].properties.subnet.id).toEqual("/subscriptions/00000000-0000-1000-A000-000000000000/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/biz");
        });
        it('validates that piblic nics have the publicIPAddress correctly referenced in the Ip configuration', () => {
            let param = _.cloneDeep(settings);
            param.nics[0].isPublic = true;
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(param.nics, param, vmIndex);

            expect(result.nics[0].ipConfigurations[0].properties.publicIPAddress.id).toEqual("/subscriptions/00000000-0000-1100-AA00-000000000000/resourceGroups/test-rg/providers/Microsoft.Network/publicIPAddresses/testVM1-nic1-pip");
            expect(result.nics[1].ipConfigurations[0].properties.hasOwnProperty("publicIPAddress")).toEqual(false);
        });
        it('validates that only one Ip configuration is created for each nic', () => {
            let param = _.cloneDeep(settings);
            param.nics[0].isPublic = true;
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(param.nics, param, vmIndex);

            expect(result.nics[0].ipConfigurations.length).toEqual(1);
            expect(result.nics[0].ipConfigurations[0].name).toEqual("ipconfig1");
            expect(result.nics[1].ipConfigurations.length).toEqual(1);
            expect(result.nics[1].ipConfigurations[0].name).toEqual("ipconfig1");
        });
        it('validates that for private nics, pips array is empty', () => {
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(settings.nics, settings, vmIndex);

            expect(result.pips.length).toEqual(0);
        });
        it('validates that pips are named correctly', () => {
            let param = _.cloneDeep(settings);
            param.nics[0].isPublic = true;
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(param.nics, param, vmIndex);

            expect(result.pips[0].name).toEqual("testVM1-nic1-pip");
        });
        it('validates that publicIPAllocationMethod is correctly assigned in the pips', () => {
            let param = _.cloneDeep(settings);
            param.nics[0].isPublic = true;
            let result = networkInterfaceSettings.processNetworkInterfaceSettings(param.nics, param, vmIndex);

            expect(result.pips[0].properties.publicIPAllocationMethod).toEqual("Dynamic");
        });
    });
})