using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VolcanionTracking.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "partners",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_partners", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "partner_api_keys",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    partner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    api_key_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    expired_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_partner_api_keys", x => x.id);
                    table.ForeignKey(
                        name: "FK_partner_api_keys_partners_partner_id",
                        column: x => x.partner_id,
                        principalTable: "partners",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sub_systems",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    partner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sub_systems", x => x.id);
                    table.ForeignKey(
                        name: "FK_sub_systems_partners_partner_id",
                        column: x => x.partner_id,
                        principalTable: "partners",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tracking_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    partner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sub_system_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    event_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    metadata = table.Column<string>(type: "jsonb", nullable: false),
                    ip = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    user_agent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tracking_events", x => x.id);
                    table.ForeignKey(
                        name: "FK_tracking_events_partners_partner_id",
                        column: x => x.partner_id,
                        principalTable: "partners",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tracking_events_sub_systems_sub_system_id",
                        column: x => x.sub_system_id,
                        principalTable: "sub_systems",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_partner_api_keys_api_key_hash",
                table: "partner_api_keys",
                column: "api_key_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_partner_api_keys_partner_id",
                table: "partner_api_keys",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "IX_partners_code",
                table: "partners",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sub_systems_code",
                table: "sub_systems",
                column: "code");

            migrationBuilder.CreateIndex(
                name: "IX_sub_systems_partner_id",
                table: "sub_systems",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "idx_tracking_events_metadata",
                table: "tracking_events",
                column: "metadata")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "idx_tracking_events_partner_time",
                table: "tracking_events",
                columns: new[] { "partner_id", "event_time" });

            migrationBuilder.CreateIndex(
                name: "idx_tracking_events_subsystem_time",
                table: "tracking_events",
                columns: new[] { "sub_system_id", "event_time" });

            migrationBuilder.CreateIndex(
                name: "idx_tracking_events_time",
                table: "tracking_events",
                column: "event_time");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "partner_api_keys");

            migrationBuilder.DropTable(
                name: "tracking_events");

            migrationBuilder.DropTable(
                name: "sub_systems");

            migrationBuilder.DropTable(
                name: "partners");
        }
    }
}
