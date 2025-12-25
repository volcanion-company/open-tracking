using System.Security.Cryptography;
using System.Text;

namespace VolcanionTracking.Api.Services;

public interface IApiKeyService
{
    string GenerateApiKey();
    string HashApiKey(string apiKey);
    bool ValidateApiKey(string apiKey, string hash);
}

public class ApiKeyService : IApiKeyService
{
    private const int KeyLength = 32;
    private const int SaltSize = 16;
    private const int Iterations = 10000;

    public string GenerateApiKey()
    {
        // Generate a cryptographically secure random API key
        var bytes = new byte[KeyLength];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
    }

    public string HashApiKey(string apiKey)
    {
        // Generate salt
        var salt = new byte[SaltSize];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(salt);

        // Hash with PBKDF2
        using var pbkdf2 = new Rfc2898DeriveBytes(apiKey, salt, Iterations, HashAlgorithmName.SHA256);
        var hash = pbkdf2.GetBytes(32);

        // Combine salt and hash
        var hashBytes = new byte[SaltSize + 32];
        Array.Copy(salt, 0, hashBytes, 0, SaltSize);
        Array.Copy(hash, 0, hashBytes, SaltSize, 32);

        return Convert.ToBase64String(hashBytes);
    }

    public bool ValidateApiKey(string apiKey, string hash)
    {
        try
        {
            var hashBytes = Convert.FromBase64String(hash);

            // Extract salt
            var salt = new byte[SaltSize];
            Array.Copy(hashBytes, 0, salt, 0, SaltSize);

            // Hash the input
            using var pbkdf2 = new Rfc2898DeriveBytes(apiKey, salt, Iterations, HashAlgorithmName.SHA256);
            var testHash = pbkdf2.GetBytes(32);

            // Compare hashes
            for (int i = 0; i < 32; i++)
            {
                if (hashBytes[i + SaltSize] != testHash[i])
                    return false;
            }

            return true;
        }
        catch
        {
            return false;
        }
    }
}
