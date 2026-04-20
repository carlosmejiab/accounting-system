namespace WebApiRoofing.Application.DTOs.Documents
{
    public class DocumentResponse
    {
        public int IdDocument { get; set; }
        public string NameDocument { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? State { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime ModificationDate { get; set; }

        public int? IdClient { get; set; }
        public string? ClientName { get; set; }

        public int? IdTask { get; set; }
        public string? TaskName { get; set; }
        public int? IdClientTask { get; set; }
        public string? ClientTaskName { get; set; }

        public int? IdEmployee { get; set; }
        public string? AssignedTo { get; set; }

        public int? IdFolder { get; set; }
        public string? FolderName { get; set; }

        public int? IdFile { get; set; }
        public string? FileName { get; set; }
        public string? Extension { get; set; }

        public int? IdStatusDocument { get; set; }
        public string? StatusDocument { get; set; }

        public string? Username { get; set; }
    }
}
