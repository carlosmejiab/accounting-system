namespace WebApiRoofing.Application.DTOs.Documents
{
    public class CreateDocumentRequest
    {
        public string NameDocument { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? IdClient { get; set; }
        public int? IdTask { get; set; }
        public int IdEmployee { get; set; }
        public int? IdFolder { get; set; }
        public int IdStatusDocument { get; set; }
    }
}
