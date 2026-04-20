namespace WebApiRoofing.Domain.Entities
{
    public class TaskComment
    {
        public int IdComment { get; set; }
        public int IdTask { get; set; }
        public int IdEmployee { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CommentDate { get; set; }
        public bool IsDeleted { get; set; }
    }
}
