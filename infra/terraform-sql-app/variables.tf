variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "sql_server_name" {
  type = string
}

variable "sql_database_name" {
  type    = string
  default = "ArchLucid"
}

variable "sql_admin_login" {
  type      = string
  sensitive = true
}

variable "sql_admin_password" {
  type      = string
  sensitive = true
}

variable "entra_admin_login" {
  type = string
}

variable "entra_admin_object_id" {
  type = string
}

variable "sql_sku" {
  type    = string
  default = "GP_S_Gen5_2"
}

variable "private_endpoint_subnet_id" {
  type = string
}
