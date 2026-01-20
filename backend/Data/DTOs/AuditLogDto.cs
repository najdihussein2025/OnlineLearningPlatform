namespace ids.Data.DTOs
{
    public class AuditLogDto
    {
        public int Id { get; set; }
        public string Action { get; set; }
        public string EntityType { get; set; }
        public int EntityId { get; set; }
        public string EntityName { get; set; }
        public string Description { get; set; }
        public string UserName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
