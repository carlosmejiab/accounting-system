using System;

namespace WebApiRoofing.Application.DTOs.Response
{
    public class ClientResponse
    {
        public int IdClient { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Address { get; set; } = string.Empty;
        public string TypeClient { get; set; } = string.Empty;
        public string Services { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Status { get; set; } = "Active"; // Active/Inactive
        public DateTime CreationDate { get; set; }
        public DateTime ModificationDate { get; set; }
        public bool AcceptSMS { get; set; }
    }
}