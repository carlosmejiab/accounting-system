using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebApiRoofing.Domain.Entities
{
    public class Contact
    {
        public int IdContact { get; set; }
        public int? IdCity { get; set; }
        public int? IdTitles { get; set; }
        public int? IdEmployee { get; set; }
        public int? IdUser { get; set; }
        public int? IdClient { get; set; }
        public string? WordAreas { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Address { get; set; }
        public string? Description { get; set; }
        public int? PreferredChannel { get; set; }  // NUEVO - FK a TablaMaestra
        public char State { get; set; }
        public DateTime? CreationDate { get; set; }
        public DateTime? ModificationDate { get; set; }

        // Navigation properties
        public string? CityName { get; set; }
        public string? StateName { get; set; }
        public string? TitleName { get; set; }
        public string? EmployeeName { get; set; }
        public string? ClientName { get; set; }
        public string? PreferredChannelName { get; set; }  // NUEVO
    }
}
