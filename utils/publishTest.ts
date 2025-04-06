import { createClient } from './supabase/client';

export interface PublishTestData {
  name: string;
  university: string;
  className: string;
  tags: string[];
  description?: string;
  questions: any[];
}

export async function publishTest(data: PublishTestData, userId: string) {
  const supabase = createClient();

  try {
    // First, try to find the university
    const { data: universities, error: universityError } = await supabase
      .from('universities')
      .select('id, name')
      .ilike('name', data.university)
      .single();

    if (universityError && universityError.code !== 'PGRST116') {
      throw new Error(`Error finding university: ${universityError.message}`);
    }

    let university_id = universities?.id;

    if (!university_id) {
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

      university_id = newUniversity.id;
    }

    // Then, try to find the class
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id')
      .ilike('name', data.className)
      .eq('university_id', university_id)
      .single();

    if (classError && classError.code !== 'PGRST116') {
      throw new Error(`Error finding class: ${classError.message}`);
    }

    let class_id = classes?.id;

    if (!class_id) {
      const { data: newClass, error: createClassError } = await supabase
        .from('classes')
        .insert([
          {
            name: data.className,
            university_id: university_id,
          },
        ])
        .select('id')
        .single();

      if (createClassError) {
        throw new Error(`Error creating class: ${createClassError.message}`);
      }

      class_id = newClass.id;
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
        university_id: university_id,
        class_id: class_id,
        description: data.description,
        tags: tagIds, // Store tag IDs directly in the test record
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
