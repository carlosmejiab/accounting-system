namespace WebApiRoofing.Application.DTOs.StorageConfig
{
    public class StorageConfigDto
    {
        public int    Id               { get; set; }
        public string BasePath         { get; set; } = string.Empty;
        public string TaskTemplate     { get; set; } = string.Empty;
        public string ClientTemplate   { get; set; } = string.Empty;
        public DateTime ModificationDate { get; set; }
    }

    public class UpdateStorageConfigRequest
    {
        public string BasePath       { get; set; } = string.Empty;
        public string TaskTemplate   { get; set; } = string.Empty;
        public string ClientTemplate { get; set; } = string.Empty;
    }
}
