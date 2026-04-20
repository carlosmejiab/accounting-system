namespace WebApiRoofing.Domain.Entities
{
    public class CrmEvent
    {
        public int IdEvent { get; set; }
        public int? RepeatNumber { get; set; }
        public int? IdStatusEvent { get; set; }
        public int? IdActivityType { get; set; }
        public int IdLocation { get; set; }
        public int? IdPriority { get; set; }
        public int? IdTask { get; set; }
        public int? IdClient { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime StartDateTime { get; set; }
        public DateTime DueDateTime { get; set; }
        public string? Descripction { get; set; }   // typo preserved from DB column
        public char? State { get; set; }
        public int? IdFrequency { get; set; }
        public int? IdEmployeeCreate { get; set; }
        public DateTime? CreationDate { get; set; }
        public DateTime? ModificationDate { get; set; }
    }
}
