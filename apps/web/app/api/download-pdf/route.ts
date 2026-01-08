import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get("responseId");

    // Fix path resolution - go to project root
    const projectRoot = process.cwd().replace(/\/apps\/web$/, "");
    const outputDir = path.join(projectRoot, "pdf-generator", "output");

    console.log(`\n📥 PDF Download Request`);
    console.log(`📁 Project root: ${projectRoot}`);
    console.log(`📁 Output directory: ${outputDir}`);

    let filePath: string;
    let fileName: string;

    if (responseId) {
      // Look for specific response ID
      fileName = `legal-document-${responseId}.html`;
      filePath = path.join(outputDir, fileName);
      console.log(`\n📥 PDF Download requested for response: ${responseId}`);
    } else {
      // Get the most recent file
      console.log(`\n📥 PDF Download requested for latest document`);

      try {
        // Check if output directory exists
        try {
          await fs.access(outputDir);
        } catch {
          console.error(`❌ Output directory not found: ${outputDir}`);
          return NextResponse.json(
            { error: "Output directory not found. No documents have been generated yet." },
            { status: 404 }
          );
        }

        const files = await fs.readdir(outputDir);
        console.log(`📁 Files in output directory:`, files);
        const htmlFiles = files.filter((f) => f.endsWith(".html"));

        if (htmlFiles.length === 0) {
          return NextResponse.json({ error: "No documents found" }, { status: 404 });
        }

        // Get the most recent file by modification time
        const fileStats = await Promise.all(
          htmlFiles.map(async (file) => {
            const stats = await fs.stat(path.join(outputDir, file));
            return { file, mtime: stats.mtime };
          })
        );

        fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        fileName = fileStats[0].file;
        filePath = path.join(outputDir, fileName);

        console.log(`📁 Found latest file: ${fileName}`);
      } catch (err) {
        console.error(`❌ Error accessing documents:`, err);
        return NextResponse.json(
          { error: `Error accessing documents folder: ${err instanceof Error ? err.message : String(err)}` },
          { status: 500 }
        );
      }
    }

    console.log(`📁 Looking for file: ${filePath}`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.log(`❌ File not found: ${filePath}`);
      return NextResponse.json({ error: "Document not found. It may still be generating." }, { status: 404 });
    }

    // Read the file
    const fileContent = await fs.readFile(filePath, "utf-8");

    console.log(`✅ File found, serving download`);

    // Return the HTML file for download (attachment)
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("❌ Error serving PDF:", error);
    return NextResponse.json({ error: "Failed to retrieve document" }, { status: 500 });
  }
}
