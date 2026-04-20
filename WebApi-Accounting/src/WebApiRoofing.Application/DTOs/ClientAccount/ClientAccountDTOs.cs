using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebApiRoofing.Application.DTOs.ClientAccount
{
    // DTO para crear una cuenta de cliente
    public class CreateClientAccountRequest
    {
        public int    IdClient      { get; set; }
        public int    IdBank        { get; set; }
        public string AccountNumber { get; set; } = string.Empty;
        public bool   IsActive      { get; set; } = true;
    }

    // DTO para actualizar una cuenta de cliente
    public class UpdateClientAccountRequest
    {
        public int    IdClientAccount { get; set; }
        public int    IdClient        { get; set; }
        public int    IdBank          { get; set; }
        public string AccountNumber   { get; set; } = string.Empty;
        public bool   IsActive        { get; set; } = true;
    }

    // DTO catálogo bancos
    public class BankCatalogDto
    {
        public int    IdTabla     { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    // DTO de respuesta
    public class ClientAccountResponse
    {
        public int IdClientAccount { get; set; }
        public int IdClient { get; set; }
        public int IdBank { get; set; }
        public string AccountNumber { get; set; } = string.Empty;
        public char State { get; set; }
        public int? IdUser { get; set; }
        public DateTime? CreationDate { get; set; }
        public DateTime? ModificationDate { get; set; }

        // Navigation properties
        public string? ClientName { get; set; }
        public string? BankName { get; set; }
    }
}
