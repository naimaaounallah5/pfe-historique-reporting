using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WAS_backend.Models;
using WAS_backend.Data;        // ← cette ligne manquait !

namespace WAS_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Étape 1 : vérifier identifiant
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Identifiant == request.Identifiant && u.IsActive);

            if (user == null)
            {
                return Unauthorized(new LoginResponse
                {
                    Success = false,
                    Message = "Identifiant incorrect."
                });
            }

            // Étape 2 : vérifier mot de passe
            bool passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!passwordValid)
            {
                return Unauthorized(new LoginResponse
                {
                    Success = false,
                    Message = "Mot de passe incorrect."
                });
            }

            // Étape 3 : succès → enregistrer LastLogin
            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new LoginResponse
            {
                Success = true,
                Message = "Connexion réussie.",
                User = new UserDto
                {
                    Id = user.Id,
                    Identifiant = user.Identifiant,
                    Nom = user.Nom,
                    Prenom = user.Prenom,
                    Role = user.Role
                }
            });
        }
    }
}