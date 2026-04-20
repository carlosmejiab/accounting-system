using System;

namespace WebApiRoofing.Domain.Entities
{
    public class Client
    {
        public int IdClient { get; set; }
        public int IdService { get; set; }
        public int IdCity { get; set; }
        public int IdLocation { get; set; }
        public int IdUser { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? Comments { get; set; }
        public string State { get; set; } = "1"; // 1=Active, 0=Inactive
        public DateTime CreationDate { get; set; }
        public DateTime ModificationDate { get; set; }
        public bool AcceptSMS { get; set; }
        public string? ConsentSMSNote { get; set; }
        public int? PaymentTerms { get; set; }
        public string? ZipCode { get; set; }
    }
}