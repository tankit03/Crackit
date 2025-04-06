import { createClient } from './supabase/client';

export interface PublishTestData {
  name: string;
  university: string;
  className: string;
  tags: string[];
  description?: string;
  questions: any[];
}

export async function publishTest(data: PublishTestData, userId?: string) {
  try {
    const supabase = createClient();

    // If userId is not provided, get it from auth
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User must be authenticated to publish a test');
      }
      userId = user.id;
    }

    let universityId: number;
    let classId: number;

    // First, try to find the university
    const { data: universities, error: universityError } = await supabase
      .from('universities')
      .select('id, name')
      .ilike('name', data.university)
      .single();

    if (universityError && universityError.code !== 'PGRST116') {
      throw new Error(`Error finding university: ${universityError.message}`);
    }

    universityId = universities?.id;

    if (!universityId) {
      // Create new university
      const { data: newUniversity, error: createUniversityError } =
        await supabase
          .from('universities')
          .insert([
            {
              name: data.university,
            },
          ])
          .select('id')
          .single();

      if (createUniversityError) {
        throw new Error(
          `Error creating university: ${createUniversityError.message}`
        );
      }

      universityId = newUniversity.id;
    }

    // Find or create class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('name', data.className)
      .eq('university_id', universityId)
      .maybeSingle();

    if (classError) {
      throw new Error(`Error finding class: ${classError.message}`);
    }

    if (!classData) {
      // Create class if it doesn't exist
      const { data: newClass, error: createClassError } = await supabase
        .from('classes')
        .insert([
          {
            name: data.className,
            university_id: universityId,
          },
        ])
        .select()
        .single();

      if (createClassError) {
        throw new Error(`Failed to create class: ${createClassError.message}`);
      }

      classId = newClass.id;
    } else {
      classId = classData.id;
    }

    // Process tags first to get all tag IDs
    const tagIds: number[] = [];

    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        try {
          // Try to find existing tag
          const { data: existingTags, error: findTagError } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .maybeSingle();

          if (findTagError) {
            console.error(`Error finding tag ${tagName}:`, findTagError);
            continue;
          }

          let tagId = existingTags?.id;

          // If tag doesn't exist, create it
          if (!tagId) {
            const { data: newTag, error: createTagError } = await supabase
              .from('tags')
              .insert([{ name: tagName }])
              .select('id')
              .single();

            if (createTagError) {
              console.error(`Error creating tag ${tagName}:`, createTagError);
              continue;
            }

            tagId = newTag.id;
          }

          if (tagId) {
            tagIds.push(tagId);
          }
        } catch (tagError) {
          console.error(`Error processing tag ${tagName}:`, tagError);
        }
      }
    }

    // Insert the test with tag IDs
    const { error: insertError } = await supabase.from('test').insert([
      {
        name: data.name,
        questions: data.questions,
        user_id: userId,
        university_id: universityId,
        class_id: classId,
        description: data.description,
        tags: tagIds,
      },
    ]);

    if (insertError) {
      console.error('Error inserting test:', insertError);
      throw new Error(`Error publishing test: ${insertError.message}`);
    }
  } catch (error) {
    console.error('Error in publishTest:', error);
    throw error;
  }
}
