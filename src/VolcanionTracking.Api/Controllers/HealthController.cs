using Microsoft.AspNetCore.Mvc;

namespace VolcanionTracking.Api.Controllers;

[ApiController]
[Route("api/v1/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            service = "Volcanion Tracking API"
        });
    }
}
