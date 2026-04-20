namespace WebApiRoofing.Application.DTOs.Documents
{
    public class TaskDocumentSummaryDto
    {
        public int     IdTask     { get; set; }
        public string  TaskName   { get; set; } = string.Empty;
        public int?    IdClient   { get; set; }
        public string? ClientName { get; set; }
        public int     DocCount   { get; set; }
        public bool    HasFolder  { get; set; }
        public int?    IdFolder   { get; set; }
    }

    public class ClientDocumentSummaryDto
    {
        public int     IdClient   { get; set; }
        public string  ClientName { get; set; } = string.Empty;
        public int     DocCount   { get; set; }
        public bool    HasFolder  { get; set; }
        public int?    IdFolder   { get; set; }
    }
}
