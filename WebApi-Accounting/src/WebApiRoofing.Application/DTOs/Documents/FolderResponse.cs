namespace WebApiRoofing.Application.DTOs.Documents
{
    public class FolderResponse
    {
        public int     IdFolder     { get; set; }
        public string  Name         { get; set; } = string.Empty;
        public string? FolderParent { get; set; }
        public string? Ruta         { get; set; }
        public int?    IdClient     { get; set; }
        public string? ClientName   { get; set; }
        public int?    IdTask       { get; set; }
        public string? TaskName     { get; set; }
    }
}
