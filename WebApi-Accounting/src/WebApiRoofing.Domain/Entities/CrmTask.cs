namespace WebApiRoofing.Domain.Entities
{
    public class CrmTask
    {
        public int IdTask { get; set; }
        public int? IdClient { get; set; }
        public int? IdTypeTask { get; set; }
        public int? IdEmployee { get; set; }
        public int? IdStatus { get; set; }
        public int? IdLocation { get; set; }
        public int? IdParentTask { get; set; }
        public int? IdContact { get; set; }
        public int? IdPriority { get; set; }
        public string? Name { get; set; }
        public DateTime? StartDateTime { get; set; }
        public DateTime? DueDateTime { get; set; }
        public int? Estimate { get; set; }
        public string? Description { get; set; }
        public string State { get; set; } = "1";
        public int? FiscalYear { get; set; }
        public int? IdClientAccount { get; set; }
        public int? IdEmployeeCreate { get; set; }
        public DateTime CreationDate { get; set; }
        public DateTime ModificationDate { get; set; }
        public int? IdGroup { get; set; }
        public bool? CheckListDocumentComplete { get; set; }
        public DateTime? PolicyExpDate { get; set; }
        public DateTime? DatePaid { get; set; }
    }
}
