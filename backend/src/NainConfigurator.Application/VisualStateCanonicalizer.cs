using System.Text;
using System.Text.Json;

namespace NainConfigurator.Application;

public static class VisualStateCanonicalizer
{
    public const int MaximumUtf8Bytes = 16 * 1024;

    public static UseCaseResult<string?> ValidateAndCanonicalize(
        VisualState? visualState)
    {
        if (visualState is null)
        {
            return UseCaseResults.Success<string?>(null);
        }

        if (visualState.SchemaVersion != 1)
        {
            return UseCaseResults.Failure<string?>(
                UseCaseStatus.InvalidRequest,
                new UseCaseError(
                    "VISUAL_STATE_SCHEMA_UNSUPPORTED",
                    "La versión del estado visual no está soportada.",
                    "visualState.schemaVersion"));
        }

        var buffer = new MemoryStream();

        using (var writer = new Utf8JsonWriter(buffer))
        {
            writer.WriteStartObject();
            writer.WriteNumber("schemaVersion", visualState.SchemaVersion);
            writer.WritePropertyName("camera");
            writer.WriteStartObject();
            WriteVector(writer, "position", visualState.Camera.Position);
            WriteVector(writer, "rotation", visualState.Camera.Rotation);
            writer.WriteEndObject();
            writer.WriteEndObject();
        }

        if (buffer.Length > MaximumUtf8Bytes)
        {
            return UseCaseResults.Failure<string?>(
                UseCaseStatus.InvalidRequest,
                new UseCaseError(
                    "VISUAL_STATE_TOO_LARGE",
                    "El estado visual supera el tamaño permitido.",
                    "visualState"));
        }

        return UseCaseResults.Success<string?>(
            Encoding.UTF8.GetString(buffer.ToArray()));
    }

    private static void WriteVector(
        Utf8JsonWriter writer,
        string propertyName,
        Vector3State vector)
    {
        writer.WritePropertyName(propertyName);
        writer.WriteStartObject();
        writer.WriteNumber("x", vector.X);
        writer.WriteNumber("y", vector.Y);
        writer.WriteNumber("z", vector.Z);
        writer.WriteEndObject();
    }
}
