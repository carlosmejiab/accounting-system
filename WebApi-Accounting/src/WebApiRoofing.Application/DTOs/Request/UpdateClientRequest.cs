using System.ComponentModel.DataAnnotations;

namespace WebApiRoofing.Application.DTOs.Request
{
    public class UpdateClientRequest
    {
        [Required(ErrorMessage = "Client name is required")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(50, ErrorMessage = "Email cannot exceed 50 characters")]
        public string? Email { get; set; }

        [StringLength(20, ErrorMessage = "Phone cannot exceed 20 characters")]
        public string? Phone { get; set; }

        [Required(ErrorMessage = "Address is required")]
        [StringLength(100, ErrorMessage = "Address cannot exceed 100 characters")]
        public string Address { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Comments cannot exceed 500 characters")]
        public string? Comments { get; set; }

        [Required(ErrorMessage = "Location is required")]
        public int IdLocation { get; set; }

        [Required(ErrorMessage = "State is required")]
        public int IdState { get; set; }

        [Required(ErrorMessage = "City is required")]
        public int IdCity { get; set; }

        [Required(ErrorMessage = "Client Type is required")]
        public int IdTypeClient { get; set; }

        [Required(ErrorMessage = "Service is required")]
        public int IdService { get; set; }

        public bool AcceptSMS { get; set; }

        public bool IsActive { get; set; } = true;
        public int? PaymentTerms { get; set; }
        public string? ZipCode { get; set; }
    }
}