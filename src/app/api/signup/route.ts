        phone,
        profile_url: profileUrl,
        is_active: true,
        active_until: activeUntil.toISOString(),
        metadata: { allowed_tabs: allowedTabs }, // ✅ store role panels
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sign JWT
    const token = jwt.sign(
      { email: data.email, role: data.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    return NextResponse.json({ token, role: data.role, allowedTabs }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
