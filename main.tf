# Terraform-konfigurasjon for å kjøre Docker-container på Azure Container Instances
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "lunsj_bot_rg" {
  name     = "lunsj-bot-rg"
  location = "westeurope"
}

resource "azurerm_container_group" "lunsj_bot" {
  name                = "lunsj-bot-group"
  location            = azurerm_resource_group.lunsj_bot_rg.location
  resource_group_name = azurerm_resource_group.lunsj_bot_rg.name

  container {
    name   = "lunsj-bot"
    image  = "<dockerhub-bruker>/lunsj-bot:latest" # Bytt ut med ditt Docker Hub-brukernavn
    cpu    = "0.5"
    memory = "1.0"
    environment_variables = {
      TOKEN       = "${var.token}"
      CHANNEL_ID  = "${var.channel_id}"
      ROLE_ID     = "${var.role_id}"
      TIMEZONE    = "Europe/Oslo"
      LUNCH_TIME  = "11:30"
    }
  }

  os_type = "Linux"
}

variable "token" {}
variable "channel_id" {}
variable "role_id" {}
