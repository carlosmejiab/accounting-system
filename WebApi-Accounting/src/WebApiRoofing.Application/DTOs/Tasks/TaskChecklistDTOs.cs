namespace WebApiRoofing.Application.DTOs.Tasks
{
    // ─────────────────────────────────────────────────────────────────────────
    //  CHECKLIST
    // ─────────────────────────────────────────────────────────────────────────
    public class ChecklistItemDto
    {
        public int       IdTaskDocumentCheckList { get; set; }
        public string    DocumentName            { get; set; } = string.Empty;
        public bool      IsChecked               { get; set; }
        public string    Status                  { get; set; } = string.Empty;   // e.g. "Pending", "Notified", "Delivered", "Not Applicable"
        public int       CodStatus               { get; set; }                   // e.g. 218, 220, 221, 222
        public string?   Notes                   { get; set; }
        public string?   Notification            { get; set; }
        public DateTime? ReceivedDate            { get; set; }
        public string?   User                    { get; set; }
    }

    public class ChecklistStatusOptionDto
    {
        public int    IdTabla     { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateChecklistItemRequest
    {
        public int       StatusId     { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public string?   Notes        { get; set; }   // optional — only updated when provided
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  NOTIFICATIONS  (columns returned by usp_GetNotificationHistoryByTaskId)
    // ─────────────────────────────────────────────────────────────────────────
    public class NotificationHistoryDto
    {
        public DateTime? FechaHora    { get; set; }   // Date & Time Sent
        public string?   MetodoEnvio  { get; set; }   // Notification Method (Email / SMS)
        public string?   Destinatario { get; set; }   // Recipient (email / phone)
        public string?   Estado       { get; set; }   // Delivery Status (Sent / Error)
        public string?   Descripcion  { get; set; }   // Notification Details
    }

    public class SendNotificationRequest
    {
        public List<int> ChecklistItemIds { get; set; } = new();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  NOTIFICATION SETTINGS
    // ─────────────────────────────────────────────────────────────────────────
    public class NotificationSettingCatalogDto
    {
        public int    IdTabla     { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class NotificationSettingsDto
    {
        public string?   DeliveryMethod          { get; set; }
        public string?   FrequencyDelivery        { get; set; }
        public DateTime? DeliveryDate             { get; set; }
        public string?   ConditionsNotification   { get; set; }
    }

    public class UpdateNotificationSettingRequest
    {
        public string  Tipo  { get; set; } = string.Empty;
        public string? Value { get; set; }
    }

    public class SendManualNotificationRequest
    {
        public string Message { get; set; } = string.Empty;
    }
}
