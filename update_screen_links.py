import os, re

def update_screen_links(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Find the specific a11y-link with aria-label="Screen reader access information"
    pattern = r'(<a class="a11y-link"\s+href=")[^"]*("\s+aria-label="Screen reader access information")'
    new_content, count = re.subn(pattern, r'\1screen.html\2', content)
    if count:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {count} screen reader link(s) in {html_path}')
    else:
        print(f'No matching link found in {html_path}')

base_dir = r"c:\\Users\\KIIT0001\\OneDrive\\Desktop\\NIC\\AMO ESIS"
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.lower().endswith('.html'):
            update_screen_links(os.path.join(root, file))
