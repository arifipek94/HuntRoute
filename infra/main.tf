  terraform {
    required_providers {
      azurerm = {
        source  = "hashicorp/azurerm"
        version = "~>3.0"
      }
      random = {
        source = "hashicorp/random"
      }
    }
  }

  provider "azurerm" {
    features {}
  }

  resource "random_integer" "suffix" {
  min = 10000
  max = 99999
}



  resource "azurerm_resource_group" "rg" {
    name     = "huntroute-rg"
    location = "westeurope"
  }

  resource "azurerm_container_registry" "acr" {
    name                = "huntrouteacr${random_integer.suffix.result}"
    resource_group_name = azurerm_resource_group.rg.name
    location            = azurerm_resource_group.rg.location
    sku                 = "Basic"   # en ucuz seçenek
    admin_enabled       = true      # basitlik için açıyoruz (lab ortamında OK)
  }
  resource "azurerm_kubernetes_cluster" "aks" {
    name                = "huntroute-aks"
    location            = azurerm_resource_group.rg.location
    resource_group_name = azurerm_resource_group.rg.name
    dns_prefix          = "huntrouteaks${random_integer.suffix.result}"

    default_node_pool {
      name       = "default"
      node_count = 1
      vm_size    = "Standard_B2s"   # en küçük node
    }

    identity {
      type = "SystemAssigned"
    }

    role_based_access_control_enabled = true

    depends_on = [azurerm_container_registry.acr]
  }

  resource "azurerm_role_assignment" "aks_acr" {
    scope                = azurerm_container_registry.acr.id
    role_definition_name = "AcrPull"
    principal_id         = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  }


  output "acr_login_server" {
    value = azurerm_container_registry.acr.login_server
  }

  output "aks_name" {
    value = azurerm_kubernetes_cluster.aks.name
  }

  output "aks_resource_group" {
    value = azurerm_resource_group.rg.name
  }


