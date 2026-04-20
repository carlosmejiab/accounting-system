using System.ComponentModel.DataAnnotations;

namespace WebApiRoofing.Application.DTOs.Tasks
{
    public class TaskCommentResponse
    {
        public int IdComment { get; set; }
        public int IdTask { get; set; }
        public int IdEmployee { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public DateTime CommentDate { get; set; }
        public bool IsDeleted { get; set; }
    }

    public class CreateCommentRequest
    {
        [Required]
        public string Comment { get; set; } = string.Empty;
    }

    public class UpdateCommentRequest
    {
        [Required]
        public string Comment { get; set; } = string.Empty;
    }
}
