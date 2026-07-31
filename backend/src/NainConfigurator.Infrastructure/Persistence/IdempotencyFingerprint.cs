using System.Security.Cryptography;
using System.Text.Json;
using NainConfigurator.Application;

namespace NainConfigurator.Infrastructure.Persistence;

internal static class IdempotencyFingerprint
{
    public static byte[] CreateConfiguration(
        CreateConfigurationCommand command,
        string? canonicalVisualStateJson)
    {
        using var stream = new MemoryStream();

        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();
            writer.WriteNumber("fingerprintVersion", 1);
            writer.WriteString("companySlug", command.CompanySlug);
            writer.WriteString("productCode", command.ProductCode);
            writer.WriteNumber("catalogVersion", command.CatalogVersion);
            writer.WriteStartArray("selectedOptionCodes");

            foreach (string optionCode in command.SelectedOptionCodes
                         .OrderBy(item => item, StringComparer.Ordinal))
            {
                writer.WriteStringValue(optionCode);
            }

            writer.WriteEndArray();
            writer.WritePropertyName("visualState");

            if (canonicalVisualStateJson is null)
            {
                writer.WriteNullValue();
            }
            else
            {
                writer.WriteRawValue(
                    canonicalVisualStateJson,
                    skipInputValidation: false);
            }

            writer.WriteEndObject();
        }

        return SHA256.HashData(stream.ToArray());
    }

    public static byte[] CreateQuote(NormalizedQuoteIntent intent)
    {
        using var stream = new MemoryStream();

        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();
            writer.WriteNumber("fingerprintVersion", 1);
            writer.WriteString(
                "configurationCode",
                intent.ConfigurationCode);
            writer.WriteString("contactName", intent.ContactName);
            writer.WriteString("contactEmail", intent.ContactEmail);
            WriteNullableString(
                writer,
                "contactPhone",
                intent.ContactPhone);
            WriteNullableString(writer, "message", intent.Message);
            writer.WriteBoolean(
                "privacyAcknowledged",
                intent.PrivacyAcknowledged);
            writer.WriteString(
                "privacyPolicyVersion",
                intent.PrivacyPolicyVersion);
            writer.WriteEndObject();
        }

        return SHA256.HashData(stream.ToArray());
    }

    private static void WriteNullableString(
        Utf8JsonWriter writer,
        string propertyName,
        string? value)
    {
        if (value is null)
        {
            writer.WriteNull(propertyName);
        }
        else
        {
            writer.WriteString(propertyName, value);
        }
    }
}
