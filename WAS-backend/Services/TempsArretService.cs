using WAS_backend.DTOs;
using WAS_backend.Repositories;  // ← Ce using est correct

namespace WAS_backend.Services
{
    public class TempsArretService : ITempsArretService
    {
        private readonly ITempsArretRepository _repository;  // ← Plus d'erreur rouge

        public TempsArretService(ITempsArretRepository repository)
        {
            _repository = repository;
        }

        public async Task<TempsArretResponseDTO> GetTempsArret(TempsArretQueryParams queryParams)
        {
            return await _repository.GetTempsArret(queryParams);
        }
    }
}