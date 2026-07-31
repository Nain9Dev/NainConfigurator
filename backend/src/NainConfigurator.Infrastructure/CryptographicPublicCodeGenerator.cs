using System.Security.Cryptography;
using NainConfigurator.Application;

namespace NainConfigurator.Infrastructure;

public sealed class CryptographicPublicCodeGenerator : IPublicCodeGenerator
{
    public string CreateConfigurationCode() => Create("NCF-");

    public string CreateQuoteRequestCode() => Create("NQR-");

    private static string Create(string prefix) =>
        prefix + Convert.ToHexString(RandomNumberGenerator.GetBytes(12));
}
