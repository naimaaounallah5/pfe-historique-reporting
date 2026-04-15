using WAS_backend.DTOs;

namespace WAS_backend.Services
{
    public interface ITempsArretService
    {
        Task<TempsArretResponseDTO> GetTempsArret(TempsArretQueryParams queryParams);
    }
}