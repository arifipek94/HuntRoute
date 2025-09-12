 terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# 1. Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "huntroutev1-rg"
  location = "Poland Central"
}

# 2. App Service Plan (Free F1)
resource "azurerm_service_plan" "plan" {
  name                = "huntroutev1-plan"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"

  sku_name = "F1"
}

# 3. Web App (Node.js 20 LTS)
resource "azurerm_linux_web_app" "app" {
  name                = "huntroutev1-app"   
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    application_stack {
      node_version = "20-lts"
    }
    always_on = false
  }
}

