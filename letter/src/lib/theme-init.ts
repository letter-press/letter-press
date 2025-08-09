import { db } from "~/lib/db";
import { getBuiltInThemes } from "~/lib/theme-registry";

// Initialize built-in themes in the database
export async function initializeBuiltInThemes() {
  const builtInThemes = getBuiltInThemes();
  
  try {
    for (const themeConfig of builtInThemes) {
      // Check if theme already exists
      const existingTheme = await db.theme.findUnique({
        where: { name: themeConfig.name },
      });
      
      if (!existingTheme) {
        console.log(`Creating built-in theme: ${themeConfig.displayName}`);
        
        await db.theme.create({
          data: {
            name: themeConfig.name,
            displayName: themeConfig.displayName,
            description: themeConfig.description,
            author: themeConfig.author,
            version: themeConfig.version,
            supportsDarkMode: themeConfig.supportsDarkMode,
            isActive: themeConfig.name === 'default', // Set default theme as active
            isBuiltIn: true,
            colors: themeConfig.colors,
            darkColors: themeConfig.darkColors,
            layouts: themeConfig.layouts,
            customCSS: themeConfig.customCSS,
          },
        });
        
        console.log(`✓ Created theme: ${themeConfig.displayName}`);
      } else {
        console.log(`Theme already exists: ${themeConfig.displayName}`);
        
        // Update built-in theme if it exists (for version updates)
        if (existingTheme.isBuiltIn) {
          await db.theme.update({
            where: { id: existingTheme.id },
            data: {
              displayName: themeConfig.displayName,
              description: themeConfig.description,
              author: themeConfig.author,
              version: themeConfig.version,
              supportsDarkMode: themeConfig.supportsDarkMode,
              colors: themeConfig.colors,
              darkColors: themeConfig.darkColors,
              layouts: themeConfig.layouts,
              customCSS: themeConfig.customCSS,
            },
          });
          console.log(`✓ Updated theme: ${themeConfig.displayName}`);
        }
      }
    }
    
    console.log('✓ Built-in themes initialization complete');
  } catch (error) {
    console.error('Error initializing built-in themes:', error);
    throw error;
  }
}

// Run the initialization if called directly  
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeBuiltInThemes()
    .then(() => {
      console.log('✓ Theme initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Theme initialization failed:', error);
      process.exit(1);
    });
}