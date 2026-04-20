using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WebApiRoofing.Domain.Entities
{
    public class ClientAccount
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
