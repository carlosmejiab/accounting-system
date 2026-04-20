using System;

namespace WebApiRoofing.Application.DTOs.Response
{
    public class ClientDetailResponse
    {
        public int IdClient { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? Comments { get; set; }

        // IDs para dropdowns
        public int IdService { get; set; }
        public int IdCity { get; set; }
        public int IdLocation { get; set; }
        public int IdState { get; set; }
        public int IdTypeClient { get; set; }

        // Nombres para display
        public string TypeClient { get; set; } = string.Empty;
        public string Services { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string StateName { get; set; } = string.Empty;

        public string State { get; set; } = "1"; // 1=Active, 0=Inactive
        public bool IsActive => State == "1";
        public string Status => State == "1" ? "Active" : "Inactive";

        public DateTime CreationDate { get; set; }
        public DateTime ModificationDate { get; set; }

        public bool AcceptSMS { get; set; }
        public string? ConsentSMSNote { get; set; }

        public string Username { get; set; } = string.Empty;
    }
}