using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable
#pragma warning disable CA1861 // EF generates inline metadata arrays.

namespace NainConfigurator.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialTechnicalDemo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "catalog");

            migrationBuilder.EnsureSchema(
                name: "sales");

            migrationBuilder.EnsureSchema(
                name: "operations");

            migrationBuilder.EnsureSchema(
                name: "security");

            migrationBuilder.CreateTable(
                name: "Companies",
                schema: "catalog",
                columns: table => new
                {
                    CompanyId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Slug = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false, collation: "Latin1_General_100_BIN2"),
                    DisplayName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DefaultLocale = table.Column<string>(type: "varchar(35)", unicode: false, maxLength: 35, nullable: false, collation: "Latin1_General_100_BIN2"),
                    ActivePrivacyPolicyId = table.Column<long>(type: "bigint", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.CompanyId);
                    table.UniqueConstraint("AK_Companies_Slug", x => x.Slug);
                    table.CheckConstraint("CK_Companies_DisplayNameLength", "LEN([DisplayName]) BETWEEN 1 AND 150");
                    table.CheckConstraint("CK_Companies_SlugFormat", "LEN([Slug]) BETWEEN 1 AND 100 AND [Slug] NOT LIKE '%[^a-z0-9-]%' COLLATE Latin1_General_100_BIN2");
                });

            migrationBuilder.CreateTable(
                name: "CompanyBrandProfiles",
                schema: "catalog",
                columns: table => new
                {
                    CompanyBrandProfileId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    Mode = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false, collation: "Latin1_General_100_BIN2"),
                    LogoAssetKey = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    PrimaryColor = table.Column<string>(type: "char(7)", unicode: false, fixedLength: true, maxLength: 7, nullable: false, collation: "Latin1_General_100_BIN2"),
                    OnPrimaryColor = table.Column<string>(type: "char(7)", unicode: false, fixedLength: true, maxLength: 7, nullable: false, collation: "Latin1_General_100_BIN2"),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyBrandProfiles", x => x.CompanyBrandProfileId);
                    table.CheckConstraint("CK_CompanyBrandProfiles_Colors", "[PrimaryColor] LIKE '#[0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]' COLLATE Latin1_General_100_BIN2 AND [OnPrimaryColor] LIKE '#[0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]' COLLATE Latin1_General_100_BIN2");
                    table.CheckConstraint("CK_CompanyBrandProfiles_Mode", "[Mode] = 'CoBranded'");
                    table.CheckConstraint("CK_CompanyBrandProfiles_Version", "[Version] > 0");
                    table.ForeignKey(
                        name: "FK_CompanyBrandProfiles_Companies",
                        column: x => x.CompanyId,
                        principalSchema: "catalog",
                        principalTable: "Companies",
                        principalColumn: "CompanyId");
                });

            migrationBuilder.CreateTable(
                name: "CompanyPrivacyPolicies",
                schema: "catalog",
                columns: table => new
                {
                    CompanyPrivacyPolicyId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    Version = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_BIN2"),
                    ResourceUrl = table.Column<string>(type: "nvarchar(max)", nullable: false, collation: "Latin1_General_100_BIN2"),
                    ContentAssetKey = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: false),
                    ContentHashSha256 = table.Column<byte[]>(type: "binary(32)", fixedLength: true, maxLength: 32, nullable: false),
                    PublishedAtUtc = table.Column<DateTime>(type: "datetime2(3)", precision: 3, nullable: false),
                    QuoteRetentionDays = table.Column<short>(type: "smallint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyPrivacyPolicies", x => x.CompanyPrivacyPolicyId);
                    table.UniqueConstraint("AK_CompanyPrivacyPolicies_Policy_Company", x => new { x.CompanyPrivacyPolicyId, x.CompanyId });
                    table.CheckConstraint("CK_CompanyPrivacyPolicies_ResourceUrl", "LEN([ResourceUrl]) BETWEEN 1 AND 2048 AND [ResourceUrl] LIKE 'https://%'");
                    table.CheckConstraint("CK_CompanyPrivacyPolicies_Retention", "[QuoteRetentionDays] BETWEEN 30 AND 1825");
                    table.ForeignKey(
                        name: "FK_CompanyPrivacyPolicies_Companies",
                        column: x => x.CompanyId,
                        principalSchema: "catalog",
                        principalTable: "Companies",
                        principalColumn: "CompanyId");
                });

            migrationBuilder.CreateTable(
                name: "Products",
                schema: "catalog",
                columns: table => new
                {
                    ProductId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    Code = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false, collation: "Latin1_General_100_BIN2"),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CatalogVersion = table.Column<int>(type: "int", nullable: false),
                    BasePrice = table.Column<decimal>(type: "decimal(19,2)", precision: 19, scale: 2, nullable: false),
                    CurrencyCode = table.Column<string>(type: "char(3)", unicode: false, fixedLength: true, maxLength: 3, nullable: false, collation: "Latin1_General_100_BIN2"),
                    PriceDisclaimer = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    VisualAssetKey = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.ProductId);
                    table.UniqueConstraint("AK_Products_Company_Product", x => new { x.CompanyId, x.ProductId });
                    table.CheckConstraint("CK_Products_BasePrice", "[BasePrice] >= 0");
                    table.CheckConstraint("CK_Products_Code", "LEN([Code]) BETWEEN 1 AND 50 AND [Code] NOT LIKE '%[^A-Z0-9_-]%' COLLATE Latin1_General_100_BIN2");
                    table.CheckConstraint("CK_Products_Currency", "[CurrencyCode] LIKE '[A-Z][A-Z][A-Z]' COLLATE Latin1_General_100_BIN2");
                    table.CheckConstraint("CK_Products_PublishedVersion", "[IsPublished] = 0 OR [CatalogVersion] > 0");
                    table.ForeignKey(
                        name: "FK_Products_Companies",
                        column: x => x.CompanyId,
                        principalSchema: "catalog",
                        principalTable: "Companies",
                        principalColumn: "CompanyId");
                });

            migrationBuilder.CreateTable(
                name: "CompatibilityRules",
                schema: "catalog",
                columns: table => new
                {
                    CompatibilityRuleId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<long>(type: "bigint", nullable: false),
                    Code = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false, collation: "Latin1_General_100_BIN2"),
                    Type = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false, collation: "Latin1_General_100_BIN2"),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompatibilityRules", x => x.CompatibilityRuleId);
                    table.UniqueConstraint("AK_CompatibilityRules_Company_Product_Rule", x => new { x.CompanyId, x.ProductId, x.CompatibilityRuleId });
                    table.CheckConstraint("CK_CompatibilityRules_Type", "[Type] = 'RequiresAny'");
                    table.ForeignKey(
                        name: "FK_CompatibilityRules_Products",
                        columns: x => new { x.CompanyId, x.ProductId },
                        principalSchema: "catalog",
                        principalTable: "Products",
                        principalColumns: new[] { "CompanyId", "ProductId" });
                });

            migrationBuilder.CreateTable(
                name: "Configurations",
                schema: "sales",
                columns: table => new
                {
                    ConfigurationId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConfigurationCode = table.Column<string>(type: "char(28)", unicode: false, fixedLength: true, maxLength: 28, nullable: false, collation: "Latin1_General_100_BIN2"),
                    ClientRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IdempotencyFingerprint = table.Column<byte[]>(type: "binary(32)", fixedLength: true, maxLength: 32, nullable: false),
                    FingerprintVersion = table.Column<byte>(type: "tinyint", nullable: false),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<long>(type: "bigint", nullable: false),
                    CatalogVersionAtCreation = table.Column<int>(type: "int", nullable: false),
                    CompanySlugSnapshot = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: false, collation: "Latin1_General_100_BIN2"),
                    CompanyNameSnapshot = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ProductCodeSnapshot = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false, collation: "Latin1_General_100_BIN2"),
                    ProductNameSnapshot = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ProductBasePriceSnapshot = table.Column<decimal>(type: "decimal(19,2)", precision: 19, scale: 2, nullable: false),
                    ContentLocale = table.Column<string>(type: "varchar(35)", unicode: false, maxLength: 35, nullable: false, collation: "Latin1_General_100_BIN2"),
                    CurrencyCode = table.Column<string>(type: "char(3)", unicode: false, fixedLength: true, maxLength: 3, nullable: false, collation: "Latin1_General_100_BIN2"),
                    EstimatedPrice = table.Column<decimal>(type: "decimal(19,2)", precision: 19, scale: 2, nullable: false),
                    VisualStateSchemaVersion = table.Column<short>(type: "smallint", nullable: true),
                    VisualStateJson = table.Column<string>(type: "nvarchar(max)", nullable: true, collation: "Latin1_General_100_BIN2"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", precision: 3, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Configurations", x => x.ConfigurationId);
                    table.UniqueConstraint("AK_Configurations_Company_Configuration", x => new { x.CompanyId, x.ConfigurationId });
                    table.CheckConstraint("CK_Configurations_Code", "LEN([ConfigurationCode]) = 28 AND [ConfigurationCode] LIKE 'NCF-%' AND SUBSTRING([ConfigurationCode], 5, 24) NOT LIKE '%[^0-9A-F]%' COLLATE Latin1_General_100_BIN2");
                    table.CheckConstraint("CK_Configurations_Prices", "[ProductBasePriceSnapshot] >= 0 AND [EstimatedPrice] >= 0");
                    table.CheckConstraint("CK_Configurations_VisualState", "([VisualStateJson] IS NULL AND [VisualStateSchemaVersion] IS NULL) OR ([VisualStateJson] IS NOT NULL AND [VisualStateSchemaVersion] = 1 AND ISJSON([VisualStateJson]) = 1 AND DATALENGTH([VisualStateJson]) <= 32768)");
                    table.ForeignKey(
                        name: "FK_Configurations_Products",
                        columns: x => new { x.CompanyId, x.ProductId },
                        principalSchema: "catalog",
                        principalTable: "Products",
                        principalColumns: new[] { "CompanyId", "ProductId" });
                });

            migrationBuilder.CreateTable(
                name: "OptionGroups",
                schema: "catalog",
                columns: table => new
                {
                    OptionGroupId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<long>(type: "bigint", nullable: false),
                    Code = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false, collation: "Latin1_General_100_BIN2"),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    MinSelections = table.Column<short>(type: "smallint", nullable: false),
                    MaxSelections = table.Column<short>(type: "smallint", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OptionGroups", x => x.OptionGroupId);
                    table.UniqueConstraint("AK_OptionGroups_Company_Product_Group", x => new { x.CompanyId, x.ProductId, x.OptionGroupId });
                    table.CheckConstraint("CK_OptionGroups_SelectionLimits", "[MinSelections] >= 0 AND ([MaxSelections] IS NULL OR ([MaxSelections] BETWEEN 1 AND 500 AND [MinSelections] <= [MaxSelections]))");
                    table.ForeignKey(
                        name: "FK_OptionGroups_Products",
                        columns: x => new { x.CompanyId, x.ProductId },
                        principalSchema: "catalog",
                        principalTable: "Products",
                        principalColumns: new[] { "CompanyId", "ProductId" });
                });

            migrationBuilder.CreateTable(
                name: "ConfigurationPriceComponents",
                schema: "sales",
                columns: table => new
                {
                    ConfigurationPriceComponentId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    ConfigurationId = table.Column<long>(type: "bigint", nullable: false),
                    Position = table.Column<short>(type: "smallint", nullable: false),
                    Type = table.Column<string>(type: "varchar(32)", unicode: false, maxLength: 32, nullable: false, collation: "Latin1_General_100_BIN2"),
                    CodeSnapshot = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false, collation: "Latin1_General_100_BIN2"),
                    NameSnapshot = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(19,2)", precision: 19, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfigurationPriceComponents", x => x.ConfigurationPriceComponentId);
                    table.CheckConstraint("CK_ConfigurationPriceComponents_Amount", "[Amount] >= 0");
                    table.CheckConstraint("CK_ConfigurationPriceComponents_Position", "[Position] BETWEEN 0 AND 500 AND ([Type] <> 'BasePrice' OR [Position] = 0)");
                    table.CheckConstraint("CK_ConfigurationPriceComponents_Type", "[Type] IN ('BasePrice', 'OptionAdjustment')");
                    table.ForeignKey(
                        name: "FK_ConfigurationPriceComponents_Configurations",
                        columns: x => new { x.CompanyId, x.ConfigurationId },
                        principalSchema: "sales",
                        principalTable: "Configurations",
                        principalColumns: new[] { "CompanyId", "ConfigurationId" });
                });

            migrationBuilder.CreateTable(
                name: "ConfigurationSelectionSnapshots",
                schema: "sales",
                columns: table => new
                {
                    ConfigurationSelectionSnapshotId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    ConfigurationId = table.Column<long>(type: "bigint", nullable: false),
                    NormalizedPosition = table.Column<short>(type: "smallint", nullable: false),
                    OptionGroupCodeSnapshot = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false, collation: "Latin1_General_100_BIN2"),
                    OptionGroupNameSnapshot = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    OptionCodeSnapshot = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false, collation: "Latin1_General_100_BIN2"),
                    OptionNameSnapshot = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    PriceAdjustmentSnapshot = table.Column<decimal>(type: "decimal(19,2)", precision: 19, scale: 2, nullable: false),
                    VisualAssetKeySnapshot = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfigurationSelectionSnapshots", x => x.ConfigurationSelectionSnapshotId);
                    table.CheckConstraint("CK_ConfigurationSelectionSnapshots_Amount", "[PriceAdjustmentSnapshot] >= 0");
                    table.CheckConstraint("CK_ConfigurationSelectionSnapshots_Position", "[NormalizedPosition] BETWEEN 0 AND 499");
                    table.ForeignKey(
                        name: "FK_ConfigurationSelections_Configurations",
                        columns: x => new { x.CompanyId, x.ConfigurationId },
                        principalSchema: "sales",
                        principalTable: "Configurations",
                        principalColumns: new[] { "CompanyId", "ConfigurationId" });
                });

            migrationBuilder.CreateTable(
                name: "QuoteRequests",
                schema: "sales",
                columns: table => new
                {
                    QuoteRequestId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuoteRequestCode = table.Column<string>(type: "char(28)", unicode: false, fixedLength: true, maxLength: 28, nullable: false, collation: "Latin1_General_100_BIN2"),
                    ClientRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IdempotencyFingerprint = table.Column<byte[]>(type: "binary(32)", fixedLength: true, maxLength: 32, nullable: false),
                    FingerprintVersion = table.Column<byte>(type: "tinyint", nullable: false),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    ConfigurationId = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false, collation: "Latin1_General_100_BIN2"),
                    ContactName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ContactEmail = table.Column<string>(type: "nvarchar(508)", maxLength: 508, nullable: false, collation: "Latin1_General_100_BIN2"),
                    ContactPhone = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    Message = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CompanyPrivacyPolicyId = table.Column<long>(type: "bigint", nullable: false),
                    PrivacyNoticeAcknowledged = table.Column<bool>(type: "bit", nullable: false),
                    AcknowledgedPrivacyPolicyVersion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false, collation: "Latin1_General_100_BIN2"),
                    AcknowledgedPrivacyContentHash = table.Column<byte[]>(type: "binary(32)", fixedLength: true, maxLength: 32, nullable: false),
                    PrivacyNoticeAcknowledgedAtUtc = table.Column<DateTime>(type: "datetime2(3)", precision: 3, nullable: false),
                    RetentionUntilUtc = table.Column<DateTime>(type: "datetime2(3)", precision: 3, nullable: false),
                    LegalHoldStartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LegalHoldReviewAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LegalHoldUntilUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LegalHoldOwnerRef = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LegalHoldReasonCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LegalHoldTicketRef = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", precision: 3, nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuoteRequests", x => x.QuoteRequestId);
                    table.UniqueConstraint("AK_QuoteRequests_Company_Quote", x => new { x.CompanyId, x.QuoteRequestId });
                    table.CheckConstraint("CK_QuoteRequests_Acknowledgment", "[PrivacyNoticeAcknowledged] = 1");
                    table.CheckConstraint("CK_QuoteRequests_Code", "LEN([QuoteRequestCode]) = 28 AND [QuoteRequestCode] LIKE 'NQR-%' AND SUBSTRING([QuoteRequestCode], 5, 24) NOT LIKE '%[^0-9A-F]%' COLLATE Latin1_General_100_BIN2");
                    table.CheckConstraint("CK_QuoteRequests_LegalHold", "([LegalHoldStartedAtUtc] IS NULL AND [LegalHoldReviewAtUtc] IS NULL AND [LegalHoldUntilUtc] IS NULL AND [LegalHoldOwnerRef] IS NULL AND [LegalHoldReasonCode] IS NULL AND [LegalHoldTicketRef] IS NULL) OR ([LegalHoldStartedAtUtc] IS NOT NULL AND [LegalHoldReviewAtUtc] IS NOT NULL AND [LegalHoldUntilUtc] IS NOT NULL AND [LegalHoldOwnerRef] IS NOT NULL AND [LegalHoldReasonCode] IS NOT NULL AND [LegalHoldTicketRef] IS NOT NULL)");
                    table.CheckConstraint("CK_QuoteRequests_Retention", "[RetentionUntilUtc] > [CreatedAtUtc]");
                    table.CheckConstraint("CK_QuoteRequests_Status", "[Status] = 'New'");
                    table.ForeignKey(
                        name: "FK_QuoteRequests_Configurations",
                        columns: x => new { x.CompanyId, x.ConfigurationId },
                        principalSchema: "sales",
                        principalTable: "Configurations",
                        principalColumns: new[] { "CompanyId", "ConfigurationId" });
                    table.ForeignKey(
                        name: "FK_QuoteRequests_PrivacyPolicies",
                        columns: x => new { x.CompanyPrivacyPolicyId, x.CompanyId },
                        principalSchema: "catalog",
                        principalTable: "CompanyPrivacyPolicies",
                        principalColumns: new[] { "CompanyPrivacyPolicyId", "CompanyId" });
                });

            migrationBuilder.CreateTable(
                name: "ProductOptions",
                schema: "catalog",
                columns: table => new
                {
                    ProductOptionId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<long>(type: "bigint", nullable: false),
                    OptionGroupId = table.Column<long>(type: "bigint", nullable: false),
                    Code = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false, collation: "Latin1_General_100_BIN2"),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    PriceAdjustment = table.Column<decimal>(type: "decimal(19,2)", precision: 19, scale: 2, nullable: false),
                    VisualAssetKey = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                    IsDefault = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductOptions", x => x.ProductOptionId);
                    table.UniqueConstraint("AK_ProductOptions_Company_Product_Option", x => new { x.CompanyId, x.ProductId, x.ProductOptionId });
                    table.CheckConstraint("CK_ProductOptions_PriceAdjustment", "[PriceAdjustment] >= 0");
                    table.ForeignKey(
                        name: "FK_ProductOptions_OptionGroups",
                        columns: x => new { x.CompanyId, x.ProductId, x.OptionGroupId },
                        principalSchema: "catalog",
                        principalTable: "OptionGroups",
                        principalColumns: new[] { "CompanyId", "ProductId", "OptionGroupId" });
                    table.ForeignKey(
                        name: "FK_ProductOptions_Products",
                        columns: x => new { x.CompanyId, x.ProductId },
                        principalSchema: "catalog",
                        principalTable: "Products",
                        principalColumns: new[] { "CompanyId", "ProductId" });
                });

            migrationBuilder.CreateTable(
                name: "QuoteNotificationOutbox",
                schema: "operations",
                columns: table => new
                {
                    QuoteNotificationOutboxId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NotificationIntentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    QuoteRequestId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2(3)", precision: 3, nullable: false),
                    AvailableAtUtc = table.Column<DateTime>(type: "datetime2(3)", precision: 3, nullable: false),
                    AttemptCount = table.Column<short>(type: "smallint", nullable: false),
                    LeaseOwnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LeaseExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastAttemptAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastFailureCode = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true, collation: "Latin1_General_100_BIN2"),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuoteNotificationOutbox", x => x.QuoteNotificationOutboxId);
                    table.CheckConstraint("CK_QuoteNotificationOutbox_Attempts", "[AttemptCount] >= 0");
                    table.CheckConstraint("CK_QuoteNotificationOutbox_CompletedLease", "[CompletedAtUtc] IS NULL OR ([LeaseOwnerId] IS NULL AND [LeaseExpiresAtUtc] IS NULL)");
                    table.CheckConstraint("CK_QuoteNotificationOutbox_Lease", "([LeaseOwnerId] IS NULL AND [LeaseExpiresAtUtc] IS NULL) OR ([LeaseOwnerId] IS NOT NULL AND [LeaseExpiresAtUtc] IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_QuoteNotificationOutbox_QuoteRequests",
                        columns: x => new { x.CompanyId, x.QuoteRequestId },
                        principalSchema: "sales",
                        principalTable: "QuoteRequests",
                        principalColumns: new[] { "CompanyId", "QuoteRequestId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompatibilityRuleSources",
                schema: "catalog",
                columns: table => new
                {
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    CompatibilityRuleId = table.Column<long>(type: "bigint", nullable: false),
                    ProductOptionId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompatibilityRuleSources", x => new { x.CompanyId, x.CompatibilityRuleId, x.ProductOptionId });
                    table.ForeignKey(
                        name: "FK_CompatibilityRuleSources_Options",
                        columns: x => new { x.CompanyId, x.ProductId, x.ProductOptionId },
                        principalSchema: "catalog",
                        principalTable: "ProductOptions",
                        principalColumns: new[] { "CompanyId", "ProductId", "ProductOptionId" });
                    table.ForeignKey(
                        name: "FK_CompatibilityRuleSources_Rules",
                        columns: x => new { x.CompanyId, x.ProductId, x.CompatibilityRuleId },
                        principalSchema: "catalog",
                        principalTable: "CompatibilityRules",
                        principalColumns: new[] { "CompanyId", "ProductId", "CompatibilityRuleId" });
                });

            migrationBuilder.CreateTable(
                name: "CompatibilityRuleTargets",
                schema: "catalog",
                columns: table => new
                {
                    CompanyId = table.Column<long>(type: "bigint", nullable: false),
                    CompatibilityRuleId = table.Column<long>(type: "bigint", nullable: false),
                    ProductOptionId = table.Column<long>(type: "bigint", nullable: false),
                    ProductId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompatibilityRuleTargets", x => new { x.CompanyId, x.CompatibilityRuleId, x.ProductOptionId });
                    table.ForeignKey(
                        name: "FK_CompatibilityRuleTargets_Options",
                        columns: x => new { x.CompanyId, x.ProductId, x.ProductOptionId },
                        principalSchema: "catalog",
                        principalTable: "ProductOptions",
                        principalColumns: new[] { "CompanyId", "ProductId", "ProductOptionId" });
                    table.ForeignKey(
                        name: "FK_CompatibilityRuleTargets_Rules",
                        columns: x => new { x.CompanyId, x.ProductId, x.CompatibilityRuleId },
                        principalSchema: "catalog",
                        principalTable: "CompatibilityRules",
                        principalColumns: new[] { "CompanyId", "ProductId", "CompatibilityRuleId" });
                });

            migrationBuilder.CreateIndex(
                name: "IX_Companies_ActivePrivacyPolicyId_CompanyId",
                schema: "catalog",
                table: "Companies",
                columns: new[] { "ActivePrivacyPolicyId", "CompanyId" });

            migrationBuilder.CreateIndex(
                name: "UQ_CompanyBrandProfiles_Company_Profile",
                schema: "catalog",
                table: "CompanyBrandProfiles",
                columns: new[] { "CompanyId", "CompanyBrandProfileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_CompanyBrandProfiles_CompanyId",
                schema: "catalog",
                table: "CompanyBrandProfiles",
                column: "CompanyId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_CompanyPrivacyPolicies_Company_Version",
                schema: "catalog",
                table: "CompanyPrivacyPolicies",
                columns: new[] { "CompanyId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_CompatibilityRules_Company_Product_Code",
                schema: "catalog",
                table: "CompatibilityRules",
                columns: new[] { "CompanyId", "ProductId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompatibilityRuleSources_CompanyId_ProductId_CompatibilityRuleId",
                schema: "catalog",
                table: "CompatibilityRuleSources",
                columns: new[] { "CompanyId", "ProductId", "CompatibilityRuleId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompatibilityRuleSources_CompanyId_ProductId_ProductOptionId",
                schema: "catalog",
                table: "CompatibilityRuleSources",
                columns: new[] { "CompanyId", "ProductId", "ProductOptionId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompatibilityRuleTargets_CompanyId_ProductId_CompatibilityRuleId",
                schema: "catalog",
                table: "CompatibilityRuleTargets",
                columns: new[] { "CompanyId", "ProductId", "CompatibilityRuleId" });

            migrationBuilder.CreateIndex(
                name: "IX_CompatibilityRuleTargets_CompanyId_ProductId_ProductOptionId",
                schema: "catalog",
                table: "CompatibilityRuleTargets",
                columns: new[] { "CompanyId", "ProductId", "ProductOptionId" });

            migrationBuilder.CreateIndex(
                name: "UQ_ConfigurationPriceComponents_Base",
                schema: "sales",
                table: "ConfigurationPriceComponents",
                columns: new[] { "CompanyId", "ConfigurationId" },
                unique: true,
                filter: "[Type] = 'BasePrice'");

            migrationBuilder.CreateIndex(
                name: "UQ_ConfigurationPriceComponents_Position",
                schema: "sales",
                table: "ConfigurationPriceComponents",
                columns: new[] { "CompanyId", "ConfigurationId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Configurations_Code",
                schema: "sales",
                table: "Configurations",
                column: "ConfigurationCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Configurations_Idempotency",
                schema: "sales",
                table: "Configurations",
                columns: new[] { "CompanyId", "ProductId", "ClientRequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_ConfigurationSelections_Option",
                schema: "sales",
                table: "ConfigurationSelectionSnapshots",
                columns: new[] { "CompanyId", "ConfigurationId", "OptionCodeSnapshot" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_ConfigurationSelections_Position",
                schema: "sales",
                table: "ConfigurationSelectionSnapshots",
                columns: new[] { "CompanyId", "ConfigurationId", "NormalizedPosition" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_OptionGroups_Company_Product_Code",
                schema: "catalog",
                table: "OptionGroups",
                columns: new[] { "CompanyId", "ProductId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductOptions_CompanyId_ProductId_OptionGroupId",
                schema: "catalog",
                table: "ProductOptions",
                columns: new[] { "CompanyId", "ProductId", "OptionGroupId" });

            migrationBuilder.CreateIndex(
                name: "UQ_ProductOptions_Company_Product_Code",
                schema: "catalog",
                table: "ProductOptions",
                columns: new[] { "CompanyId", "ProductId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_Products_Company_Code",
                schema: "catalog",
                table: "Products",
                columns: new[] { "CompanyId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_QuoteNotificationOutbox_Intent",
                schema: "operations",
                table: "QuoteNotificationOutbox",
                column: "NotificationIntentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_QuoteNotificationOutbox_Quote",
                schema: "operations",
                table: "QuoteNotificationOutbox",
                columns: new[] { "CompanyId", "QuoteRequestId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuoteRequests_CompanyId_ConfigurationId",
                schema: "sales",
                table: "QuoteRequests",
                columns: new[] { "CompanyId", "ConfigurationId" });

            migrationBuilder.CreateIndex(
                name: "IX_QuoteRequests_CompanyPrivacyPolicyId_CompanyId",
                schema: "sales",
                table: "QuoteRequests",
                columns: new[] { "CompanyPrivacyPolicyId", "CompanyId" });

            migrationBuilder.CreateIndex(
                name: "UQ_QuoteRequests_Code",
                schema: "sales",
                table: "QuoteRequests",
                column: "QuoteRequestCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UQ_QuoteRequests_Idempotency",
                schema: "sales",
                table: "QuoteRequests",
                columns: new[] { "CompanyId", "ClientRequestId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Companies_ActivePrivacyPolicy",
                schema: "catalog",
                table: "Companies",
                columns: new[] { "ActivePrivacyPolicyId", "CompanyId" },
                principalSchema: "catalog",
                principalTable: "CompanyPrivacyPolicies",
                principalColumns: new[] { "CompanyPrivacyPolicyId", "CompanyId" });

            migrationBuilder.Sql(
                """
                CREATE ROLE [NainConfiguratorOperationsRlsBypass] AUTHORIZATION [dbo];
                CREATE ROLE [NainConfiguratorScopeResolverBypass] AUTHORIZATION [dbo];
                CREATE ROLE [NainConfiguratorPublicRuntime] AUTHORIZATION [dbo];

                CREATE USER [NainConfiguratorScopeResolver] WITHOUT LOGIN;
                CREATE USER [NainConfiguratorDemoSeeder] WITHOUT LOGIN;

                ALTER ROLE [NainConfiguratorScopeResolverBypass]
                    ADD MEMBER [NainConfiguratorScopeResolver];
                ALTER ROLE [NainConfiguratorOperationsRlsBypass]
                    ADD MEMBER [NainConfiguratorDemoSeeder];

                DENY IMPERSONATE ON USER::[NainConfiguratorScopeResolver] TO [public];
                DENY IMPERSONATE ON USER::[NainConfiguratorDemoSeeder] TO [public];

                GRANT SELECT, INSERT, UPDATE, DELETE
                    ON SCHEMA::[catalog] TO [NainConfiguratorDemoSeeder];
                GRANT SELECT, INSERT, UPDATE, DELETE
                    ON SCHEMA::[sales] TO [NainConfiguratorDemoSeeder];
                GRANT SELECT, INSERT, UPDATE, DELETE
                    ON SCHEMA::[operations] TO [NainConfiguratorDemoSeeder];
                """);

            migrationBuilder.Sql(
                """
                CREATE FUNCTION [security].[fn_CompanyAccessPredicate]
                (
                    @CompanyId bigint
                )
                RETURNS TABLE
                WITH SCHEMABINDING
                AS
                RETURN
                (
                    SELECT 1 AS [Allowed]
                    WHERE
                        @CompanyId = TRY_CONVERT(
                            bigint,
                            SESSION_CONTEXT(N'CompanyId'))
                        OR IS_ROLEMEMBER(
                            N'NainConfiguratorOperationsRlsBypass') = 1
                        OR IS_ROLEMEMBER(
                            N'NainConfiguratorScopeResolverBypass') = 1
                );
                """);

            migrationBuilder.Sql(
                """
                CREATE PROCEDURE [security].[ResolveCompanyScopeBySlug]
                    @Slug varchar(100)
                WITH EXECUTE AS 'NainConfiguratorScopeResolver'
                AS
                BEGIN
                    SET NOCOUNT ON;

                    SELECT [CompanyId]
                    FROM [catalog].[Companies]
                    WHERE [Slug] = @Slug;
                END;
                """);

            migrationBuilder.Sql(
                """
                CREATE PROCEDURE [security].[ResolveConfigurationScopeByCode]
                    @ConfigurationCode char(28)
                WITH EXECUTE AS 'NainConfiguratorScopeResolver'
                AS
                BEGIN
                    SET NOCOUNT ON;

                    SELECT [CompanyId], [ConfigurationId]
                    FROM [sales].[Configurations]
                    WHERE [ConfigurationCode] = @ConfigurationCode;
                END;
                """);

            migrationBuilder.Sql(
                """
                CREATE SECURITY POLICY [security].[CompanyIsolationPolicy]
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[Companies],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[Companies] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[Companies] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompanyBrandProfiles],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompanyBrandProfiles] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompanyBrandProfiles] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompanyPrivacyPolicies],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompanyPrivacyPolicies] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompanyPrivacyPolicies] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[Products],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[Products] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[Products] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[OptionGroups],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[OptionGroups] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[OptionGroups] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[ProductOptions],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[ProductOptions] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[ProductOptions] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompatibilityRules],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompatibilityRules] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompatibilityRules] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompatibilityRuleSources],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompatibilityRuleSources] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompatibilityRuleSources] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompatibilityRuleTargets],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompatibilityRuleTargets] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [catalog].[CompatibilityRuleTargets] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[Configurations],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[Configurations] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[Configurations] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[ConfigurationSelectionSnapshots],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[ConfigurationSelectionSnapshots] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[ConfigurationSelectionSnapshots] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[ConfigurationPriceComponents],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[ConfigurationPriceComponents] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[ConfigurationPriceComponents] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[QuoteRequests],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[QuoteRequests] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [sales].[QuoteRequests] BEFORE UPDATE,
                    ADD FILTER PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [operations].[QuoteNotificationOutbox],
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [operations].[QuoteNotificationOutbox] AFTER INSERT,
                    ADD BLOCK PREDICATE [security].[fn_CompanyAccessPredicate]([CompanyId])
                        ON [operations].[QuoteNotificationOutbox] BEFORE UPDATE
                WITH (STATE = ON, SCHEMABINDING = ON);
                """);

            migrationBuilder.Sql(
                """
                GRANT EXECUTE ON OBJECT::[security].[ResolveCompanyScopeBySlug]
                    TO [NainConfiguratorPublicRuntime];
                GRANT EXECUTE ON OBJECT::[security].[ResolveConfigurationScopeByCode]
                    TO [NainConfiguratorPublicRuntime];

                GRANT SELECT ON OBJECT::[catalog].[Companies]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT ON OBJECT::[catalog].[CompanyBrandProfiles]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT ON OBJECT::[catalog].[CompanyPrivacyPolicies]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT ON OBJECT::[catalog].[Products]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT ON OBJECT::[catalog].[OptionGroups]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT ON OBJECT::[catalog].[ProductOptions]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT ON OBJECT::[catalog].[CompatibilityRules]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT ON OBJECT::[catalog].[CompatibilityRuleSources]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT ON OBJECT::[catalog].[CompatibilityRuleTargets]
                    TO [NainConfiguratorPublicRuntime];

                GRANT SELECT, INSERT ON OBJECT::[sales].[Configurations]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT, INSERT ON OBJECT::[sales].[ConfigurationSelectionSnapshots]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT, INSERT ON OBJECT::[sales].[ConfigurationPriceComponents]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT, INSERT ON OBJECT::[sales].[QuoteRequests]
                    TO [NainConfiguratorPublicRuntime];
                GRANT SELECT, INSERT ON OBJECT::[operations].[QuoteNotificationOutbox]
                    TO [NainConfiguratorPublicRuntime];
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP SECURITY POLICY IF EXISTS [security].[CompanyIsolationPolicy];
                DROP PROCEDURE IF EXISTS [security].[ResolveConfigurationScopeByCode];
                DROP PROCEDURE IF EXISTS [security].[ResolveCompanyScopeBySlug];
                DROP FUNCTION IF EXISTS [security].[fn_CompanyAccessPredicate];

                DROP USER IF EXISTS [NainConfiguratorDemoSeeder];
                DROP USER IF EXISTS [NainConfiguratorScopeResolver];

                DROP ROLE IF EXISTS [NainConfiguratorPublicRuntime];
                DROP ROLE IF EXISTS [NainConfiguratorScopeResolverBypass];
                DROP ROLE IF EXISTS [NainConfiguratorOperationsRlsBypass];
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Companies_ActivePrivacyPolicy",
                schema: "catalog",
                table: "Companies");

            migrationBuilder.DropTable(
                name: "CompanyBrandProfiles",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "CompatibilityRuleSources",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "CompatibilityRuleTargets",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "ConfigurationPriceComponents",
                schema: "sales");

            migrationBuilder.DropTable(
                name: "ConfigurationSelectionSnapshots",
                schema: "sales");

            migrationBuilder.DropTable(
                name: "QuoteNotificationOutbox",
                schema: "operations");

            migrationBuilder.DropTable(
                name: "ProductOptions",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "CompatibilityRules",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "QuoteRequests",
                schema: "sales");

            migrationBuilder.DropTable(
                name: "OptionGroups",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "Configurations",
                schema: "sales");

            migrationBuilder.DropTable(
                name: "Products",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "CompanyPrivacyPolicies",
                schema: "catalog");

            migrationBuilder.DropTable(
                name: "Companies",
                schema: "catalog");
        }
    }
}
#pragma warning restore CA1861
